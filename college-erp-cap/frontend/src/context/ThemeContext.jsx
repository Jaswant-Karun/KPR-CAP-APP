import React, { createContext, useState, useEffect } from "react";
import { getPublicSystemSettings } from "../services/adminService";

export const ThemeContext = createContext();

const THEME_KEY = "kpr_app_theme";
const DEFAULT_THEME = "dark";

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(DEFAULT_THEME);

  const applyTheme = (themeMode) => {
    const htmlElement = document.documentElement;

    if (themeMode === "light") {
      htmlElement.setAttribute("data-theme", "light");
      htmlElement.classList.add("light-mode");
      htmlElement.classList.remove("dark-mode");
      document.body.style.backgroundColor = "#f8f9fa";
      document.body.style.color = "#1a1a1a";
    } else {
      htmlElement.setAttribute("data-theme", "dark");
      htmlElement.classList.add("dark-mode");
      htmlElement.classList.remove("light-mode");
      document.body.style.backgroundColor = "#0a0a0a";
      document.body.style.color = "#e0e0e0";
    }
  };

  const applyAndStoreTheme = (themeValue) => {
    const normalized = themeValue === "light" ? "light" : "dark";
    setTheme(normalized);
    applyTheme(normalized);
    localStorage.setItem(THEME_KEY, normalized);
  };

  // Load cached theme first to avoid visual flash, then sync from backend.
  useEffect(() => {
    const cachedTheme = localStorage.getItem(THEME_KEY);
    applyAndStoreTheme(cachedTheme || DEFAULT_THEME);

    const syncThemeFromServer = async () => {
      try {
        const response = await getPublicSystemSettings();
        const serverTheme = response?.settings?.appTheme;
        applyAndStoreTheme(serverTheme || DEFAULT_THEME);
      } catch (error) {
        console.warn("Failed to sync theme from server:", error);
      }
    };

    syncThemeFromServer();

    const handleStorageChange = () => {
      const savedTheme = localStorage.getItem(THEME_KEY) || DEFAULT_THEME;
      applyAndStoreTheme(savedTheme);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    const handleSettingsUpdate = (event) => {
      const updatedTheme = event?.detail?.appTheme;
      if (updatedTheme) {
        applyAndStoreTheme(updatedTheme);
      }
    };

    window.addEventListener("admin-settings-updated", handleSettingsUpdate);
    return () => window.removeEventListener("admin-settings-updated", handleSettingsUpdate);
  }, []);

  const toggleTheme = (newTheme) => {
    applyAndStoreTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
