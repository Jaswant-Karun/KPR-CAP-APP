import { createContext, useEffect, useState } from "react";
import { getPublicSystemSettings } from "../services/adminService";

export const PublicSettingsContext = createContext({
  settings: {
    allowStudentSignup: true,
    allowFacultySignup: true,
    enforceStrongPassword: true,
    maintenanceMode: false,
    buttonSoundEnabled: true,
    appTheme: "dark",
    defaultDepartment: "CSE",
  },
  refreshSettings: async () => {},
});

const DEFAULT_PUBLIC_SETTINGS = {
  allowStudentSignup: true,
  allowFacultySignup: true,
  enforceStrongPassword: true,
  maintenanceMode: false,
  buttonSoundEnabled: true,
  appTheme: "dark",
  defaultDepartment: "CSE",
};

export const PublicSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_PUBLIC_SETTINGS);

  const refreshSettings = async () => {
    try {
      const response = await getPublicSystemSettings();
      const incoming = response?.settings || {};
      setSettings((prev) => ({ ...prev, ...incoming }));
      return incoming;
    } catch (error) {
      console.warn("Failed to load public settings:", error);
      return null;
    }
  };

  useEffect(() => {
    refreshSettings();

    const handleSettingsUpdate = (event) => {
      if (event?.detail) {
        setSettings((prev) => ({ ...prev, ...event.detail }));
      }
    };

    window.addEventListener("admin-settings-updated", handleSettingsUpdate);
    return () => window.removeEventListener("admin-settings-updated", handleSettingsUpdate);
  }, []);

  return (
    <PublicSettingsContext.Provider value={{ settings, refreshSettings }}>
      {children}
    </PublicSettingsContext.Provider>
  );
};
