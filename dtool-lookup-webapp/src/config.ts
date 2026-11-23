/**
 * Single source of truth for build-time server and webapp configuration.
 *
 * All modules must derive server endpoints and feature flags from here so
 * that a missing environment variable degrades consistently instead of
 * producing "healthy but broken" states from divergent defaults.
 */

export const serverUrl: string =
  process.env.VUE_APP_DTOOL_LOOKUP_SERVER_URL || "http://localhost:5000";

export const tokenGeneratorUrl: string =
  process.env.VUE_APP_DTOOL_LOOKUP_SERVER_TOKEN_GENERATOR_URL ||
  `${serverUrl}/auth/token`;

export const authLogoutUrl: string =
  process.env.VUE_APP_DTOOL_LOOKUP_SERVER_AUTH_LOGOUT_URL ||
  `${serverUrl}/auth/logout`;

/**
 * Device authorization endpoints of the dserver OAuth2 token plugin, used to
 * approve command-line logins (`dtool dserver login`).
 */
export const oauth2DeviceUrl: string =
  process.env.VUE_APP_OAUTH2_DEVICE_URL || `${serverUrl}/auth/oauth2/device`;

export const authEnabled = process.env.VUE_APP_AUTH_ENABLED !== "false";
