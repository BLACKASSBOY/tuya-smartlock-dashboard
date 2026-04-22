import crypto from "crypto";
import { ENV } from "./_core/env";

/**
 * Tuya API client for smart lock operations
 * Handles HMAC-SHA256 authentication and API requests
 */

interface TuyaApiResponse<T = unknown> {
  success: boolean;
  result?: T;
  msg?: string;
  t?: number;
  code?: string;
}

interface TuyaAccessToken {
  access_token: string;
  expire_time: number;
  refresh_token?: string;
}

interface LockStatus {
  locked: boolean;
  battery_level: number;
  last_unlock_time?: number;
}

interface TempPassword {
  password_id: string;
  password: string;
  name?: string;
  create_time: number;
  effective_time: number;
  expire_time: number;
  open_method: number;
}

interface UnlockRecord {
  operate_time: number;
  operate_type: string;
  operate_id?: string;
  operate_name?: string;
}

interface AlarmRecord {
  time: number;
  alarm_type: string;
  alarm_name?: string;
}

// Cache for access token
let cachedAccessToken: TuyaAccessToken | null = null;

/**
 * Generate HMAC-SHA256 signature for Tuya API requests
 */
function generateSignature(
  method: string,
  path: string,
  body: string,
  accessToken: string | null,
  timestamp: number,
  nonce: string
): string {
  const clientId = ENV.tuyaAccessId;
  const clientSecret = ENV.tuyaAccessSecret;

  // Calculate Content-SHA256
  const contentSha256 = crypto
    .createHash("sha256")
    .update(body)
    .digest("hex");

  // Build stringToSign
  const stringToSign = [
    method,
    contentSha256,
    "",
    path,
  ].join("\n");

  // Build signature string
  let signatureStr = clientId + timestamp + nonce + stringToSign;
  if (accessToken) {
    signatureStr = clientId + accessToken + timestamp + nonce + stringToSign;
  }

  // Generate HMAC-SHA256 signature
  const signature = crypto
    .createHmac("sha256", clientSecret)
    .update(signatureStr)
    .digest("hex")
    .toUpperCase();

  return signature;
}

/**
 * Get Tuya access token
 */
async function getAccessToken(): Promise<string> {
  // Check if cached token is still valid
  if (cachedAccessToken && cachedAccessToken.expire_time > Date.now() + 60000) {
    return cachedAccessToken.access_token;
  }

  const method = "GET";
  const path = "/v1.0/token?grant_type=1";
  const body = "";
  const timestamp = Date.now();
  const nonce = crypto.randomUUID();

  const signature = generateSignature(method, path, body, null, timestamp, nonce);

  const url = `https://openapi.tuya${getRegionSuffix()}/v1.0/token?grant_type=1`;

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        client_id: ENV.tuyaAccessId,
        sign: signature,
        sign_method: "HMAC-SHA256",
        t: timestamp.toString(),
        nonce,
      },
    });

    if (!response.ok) {
      console.error(`[Tuya] Failed to get access token. Status: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to get Tuya access token: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`[Tuya] Fetch error:`, error);
    throw error;
  }

  let data;
  try {
    data = (await response!.json()) as TuyaApiResponse<TuyaAccessToken>;
  } catch (error) {
    console.error(`[Tuya] Failed to parse JSON response:`, error);
    throw error;
  }

  if (!data.success || !data.result) {
    console.error(`[Tuya] API error response:`, data);
    throw new Error(
      `Tuya API error: ${data.msg || "Failed to get access token"}`
    );
  }

  cachedAccessToken = data.result;
  return data.result.access_token;
}

/**
 * Get Tuya region suffix for API endpoint
 */
function getRegionSuffix(): string {
  const region = ENV.tuyaRegion || "us";
  const regionMap: Record<string, string> = {
    us: "us.com",
    "us-e": ".com",
    eu: ".eu.com",
    "eu-w": ".eu.com",
    cn: ".cn.com",
    in: ".in.com",
    sg: ".sg.com",
  };
  return regionMap[region] || ".com";
}

/**
 * Make authenticated request to Tuya API
 */
async function makeRequest<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const accessToken = await getAccessToken();
  const timestamp = Date.now();
  const nonce = crypto.randomUUID();
  const bodyStr = body ? JSON.stringify(body) : "";

  const signature = generateSignature(
    method,
    path,
    bodyStr,
    accessToken,
    timestamp,
    nonce
  );

  const url = `https://openapi.tuya${getRegionSuffix()}${path}`;

  const response = await fetch(url, {
    method,
    headers: {
      client_id: ENV.tuyaAccessId,
      access_token: accessToken,
      sign: signature,
      sign_method: "HMAC-SHA256",
      t: timestamp.toString(),
      nonce,
      "Content-Type": "application/json",
    },
    body: bodyStr || undefined,
  });

  if (!response.ok) {
    throw new Error(
      `Tuya API request failed: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as TuyaApiResponse<T>;

  if (!data.success) {
    throw new Error(`Tuya API error: ${data.msg || "Unknown error"}`);
  }

  return data.result as T;
}

/**
 * Get lock status
 */
export async function getLockStatus(): Promise<LockStatus> {
  const deviceId = ENV.tuyaDeviceId;
  const path = `/v1.0/devices/${deviceId}`;

  const response = await makeRequest<Record<string, unknown>>(
    "GET",
    path
  );

  // Extract lock status from device properties
  const properties = (response.status || []) as Array<{
    code: string;
    value: unknown;
  }>;

  let locked = false;
  let batteryLevel = 100;

  for (const prop of properties) {
    if (prop.code === "lock_state" || prop.code === "lock") {
      locked = prop.value === 1 || prop.value === true;
    }
    if (prop.code === "battery_percentage" || prop.code === "battery") {
      batteryLevel = typeof prop.value === "number" ? prop.value : 100;
    }
  }

  return {
    locked,
    battery_level: batteryLevel,
  };
}

/**
 * Lock the door
 */
export async function lockDoor(): Promise<boolean> {
  const deviceId = ENV.tuyaDeviceId;
  const path = `/v1.0/devices/${deviceId}/commands`;

  await makeRequest<Record<string, unknown>>("POST", path, {
    commands: [
      {
        code: "lock",
        value: 1,
      },
    ],
  });

  return true;
}

/**
 * Unlock the door
 */
export async function unlockDoor(): Promise<boolean> {
  const deviceId = ENV.tuyaDeviceId;
  const path = `/v1.0/devices/${deviceId}/commands`;

  await makeRequest<Record<string, unknown>>("POST", path, {
    commands: [
      {
        code: "lock",
        value: 0,
      },
    ],
  });

  return true;
}

/**
 * Get password ticket for creating temporary passwords
 */
export async function getPasswordTicket(): Promise<string> {
  const deviceId = ENV.tuyaDeviceId;
  const path = `/v1.0/devices/${deviceId}/door-lock/password-ticket`;

  const response = await makeRequest<{ ticket: string }>(
    "POST",
    path
  );

  return response.ticket;
}

/**
 * Create a temporary password
 */
export async function createTempPassword(
  name: string,
  validityDays: number,
  expirationTime?: number
): Promise<TempPassword> {
  const deviceId = ENV.tuyaDeviceId;
  const ticket = await getPasswordTicket();

  // Calculate effective and expiration times
  const now = Date.now();
  const effectiveTime = Math.floor(now / 1000);
  const expireTime = expirationTime
    ? Math.floor(expirationTime / 1000)
    : Math.floor((now + validityDays * 24 * 60 * 60 * 1000) / 1000);

  const path = `/v1.0/devices/${deviceId}/door-lock/temp-password`;

  const response = await makeRequest<TempPassword>("POST", path, {
    name,
    ticket,
    effective_time: effectiveTime,
    expire_time: expireTime,
  });

  return response;
}

/**
 * Get list of temporary passwords
 */
export async function getTempPasswords(): Promise<TempPassword[]> {
  const deviceId = ENV.tuyaDeviceId;
  const path = `/v1.0/devices/${deviceId}/door-lock/temp-passwords`;

  const response = await makeRequest<TempPassword[]>(
    "GET",
    path
  );

  return response || [];
}

/**
 * Delete a temporary password
 */
export async function deleteTempPassword(passwordId: string): Promise<boolean> {
  const deviceId = ENV.tuyaDeviceId;
  const path = `/v1.0/devices/${deviceId}/door-lock/temp-passwords/${passwordId}`;

  await makeRequest<Record<string, unknown>>("DELETE", path);

  return true;
}

/**
 * Freeze a temporary password
 */
export async function freezeTempPassword(passwordId: string): Promise<boolean> {
  const deviceId = ENV.tuyaDeviceId;
  const path = `/v1.0/devices/${deviceId}/door-lock/temp-passwords/${passwordId}/freeze-password`;

  await makeRequest<Record<string, unknown>>("PUT", path);

  return true;
}

/**
 * Unfreeze a temporary password
 */
export async function unfreezeTempPassword(
  passwordId: string
): Promise<boolean> {
  const deviceId = ENV.tuyaDeviceId;
  const path = `/v1.0/devices/${deviceId}/door-lock/temp-passwords/${passwordId}/unfreeze-password`;

  await makeRequest<Record<string, unknown>>("PUT", path);

  return true;
}

/**
 * Get unlock history
 */
export async function getUnlockHistory(
  startTime?: number,
  endTime?: number
): Promise<UnlockRecord[]> {
  const deviceId = ENV.tuyaDeviceId;
  const now = Date.now();
  const start = startTime || now - 30 * 24 * 60 * 60 * 1000; // Last 30 days
  const end = endTime || now;

  const path = `/v1.0/devices/${deviceId}/door-lock/open-logs?start_time=${Math.floor(start / 1000)}&end_time=${Math.floor(end / 1000)}`;

  const response = await makeRequest<UnlockRecord[]>(
    "GET",
    path
  );

  return response || [];
}

/**
 * Get alarm history
 */
export async function getAlarmHistory(
  startTime?: number,
  endTime?: number
): Promise<AlarmRecord[]> {
  const deviceId = ENV.tuyaDeviceId;
  const now = Date.now();
  const start = startTime || now - 30 * 24 * 60 * 60 * 1000; // Last 30 days
  const end = endTime || now;

  const path = `/v1.0/devices/${deviceId}/door-lock/alarm-logs?start_time=${Math.floor(start / 1000)}&end_time=${Math.floor(end / 1000)}`;

  const response = await makeRequest<AlarmRecord[]>(
    "GET",
    path
  );

  return response || [];
}

interface DoorSensorStatus {
  isOpen: boolean;
  battery_level: number;
  last_change_time?: number;
}

/**
 * Get contact sensor (door open/close) status
 */
export async function getContactSensorStatus(): Promise<DoorSensorStatus> {
  const sensorId = ENV.tuyaContactSensorId;
  if (!sensorId) {
    throw new Error("Contact sensor ID not configured");
  }

  const path = `/v1.0/devices/${sensorId}`;

  const response = await makeRequest<Record<string, unknown>>(
    "GET",
    path
  );

  // Extract sensor status from device properties
  const properties = (response.status || []) as Array<{
    code: string;
    value: unknown;
  }>;

  let isOpen = false;
  let batteryLevel = 100;

  for (const prop of properties) {
    // Common property codes for door/window sensors
    if (
      prop.code === "door_window_state" ||
      prop.code === "contact_state" ||
      prop.code === "open_close"
    ) {
      // Typically: 1 = open, 0 = closed
      isOpen = prop.value === 1 || prop.value === true;
    }
    if (
      prop.code === "battery_percentage" ||
      prop.code === "battery" ||
      prop.code === "battery_value"
    ) {
      batteryLevel = typeof prop.value === "number" ? prop.value : 100;
    }
  }

  return {
    isOpen,
    battery_level: batteryLevel,
  };
}
