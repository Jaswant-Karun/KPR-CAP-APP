const { pool } = require("../config/db");

const GLOBAL_SETTINGS_KEY = "global";
const DEFAULT_SYSTEM_SETTINGS = {
  allowStudentSignup: true,
  allowFacultySignup: true,
  enforceStrongPassword: true,
  maintenanceMode: false,
  buttonSoundEnabled: true,
  appTheme: "dark",
  defaultDepartment: "CSE",
};

const normalizeTheme = (themeValue) => (String(themeValue || "").toLowerCase() === "light" ? "light" : "dark");

const sanitizeSystemSettings = (incoming = {}, base = DEFAULT_SYSTEM_SETTINGS) => {
  const merged = { ...base, ...(incoming || {}) };
  return {
    allowStudentSignup: Boolean(merged.allowStudentSignup),
    allowFacultySignup: Boolean(merged.allowFacultySignup),
    enforceStrongPassword: Boolean(merged.enforceStrongPassword),
    maintenanceMode: Boolean(merged.maintenanceMode),
    buttonSoundEnabled: Boolean(merged.buttonSoundEnabled),
    appTheme: normalizeTheme(merged.appTheme),
    defaultDepartment: String(merged.defaultDepartment || "CSE").toUpperCase(),
  };
};

const getOrCreateSystemSettings = async () => {
  const current = await pool.query(
    `SELECT value FROM system_settings WHERE key = $1 LIMIT 1`,
    [GLOBAL_SETTINGS_KEY]
  );

  if (current.rows.length > 0) {
    return sanitizeSystemSettings(current.rows[0].value, DEFAULT_SYSTEM_SETTINGS);
  }

  await pool.query(
    `
      INSERT INTO system_settings (key, value)
      VALUES ($1, $2::jsonb)
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `,
    [GLOBAL_SETTINGS_KEY, JSON.stringify(DEFAULT_SYSTEM_SETTINGS)]
  );

  return { ...DEFAULT_SYSTEM_SETTINGS };
};

const updateSystemSettings = async (incoming = {}) => {
  const existing = await getOrCreateSystemSettings();
  const nextSettings = sanitizeSystemSettings(incoming, existing);

  await pool.query(
    `
      INSERT INTO system_settings (key, value)
      VALUES ($1, $2::jsonb)
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `,
    [GLOBAL_SETTINGS_KEY, JSON.stringify(nextSettings)]
  );

  return nextSettings;
};

const getPublicSystemSettings = async () => {
  const settings = await getOrCreateSystemSettings();
  return {
    allowStudentSignup: settings.allowStudentSignup,
    allowFacultySignup: settings.allowFacultySignup,
    enforceStrongPassword: settings.enforceStrongPassword,
    maintenanceMode: settings.maintenanceMode,
    buttonSoundEnabled: settings.buttonSoundEnabled,
    appTheme: settings.appTheme,
    defaultDepartment: settings.defaultDepartment,
  };
};

module.exports = {
  DEFAULT_SYSTEM_SETTINGS,
  getOrCreateSystemSettings,
  updateSystemSettings,
  getPublicSystemSettings,
  sanitizeSystemSettings,
};
