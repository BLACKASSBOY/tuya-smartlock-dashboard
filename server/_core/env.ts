// Environment variables - loaded at runtime to avoid Railway build failures
// Provide safe defaults during build time
const getEnv = () => {
  // During build phase, provide empty defaults
  // During runtime, actual values from Railway secrets will be used
  return {
    appId: process.env.VITE_APP_ID || "",
    cookieSecret: process.env.JWT_SECRET || "dev-secret-key",
    databaseUrl: process.env.DATABASE_URL || "mysql://localhost/dev",


    isProduction: process.env.NODE_ENV === "production",


    tuyaAccessId: process.env.TUYA_ACCESS_ID || "",
    tuyaAccessSecret: process.env.TUYA_ACCESS_SECRET || "",
    tuyaDeviceId: process.env.TUYA_DEVICE_ID || "",
    tuyaContactSensorId: process.env.TUYA_CONTACT_SENSOR_ID || "",
    tuyaRegion: process.env.TUYA_REGION || "us",
  };
};

// Export as a getter function to ensure lazy evaluation
export const ENV = getEnv();

// Also export the getter for cases where we need fresh values
export const getENV = getEnv;
