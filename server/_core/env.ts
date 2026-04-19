export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  tuyaAccessId: process.env.TUYA_ACCESS_ID ?? "",
  tuyaAccessSecret: process.env.TUYA_ACCESS_SECRET ?? "",
  tuyaDeviceId: process.env.TUYA_DEVICE_ID ?? "",
  tuyaRegion: process.env.TUYA_REGION ?? "us",
};
