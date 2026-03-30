import React, { createContext, useState, useEffect } from "react";

export const ThemeContext = createContext();

const STORAGE_KEY = "kpr_admin_settings";
const THEME_KEY = "kpr_app_theme";

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("dark"); // "dark" or "light"

  // Load theme from localStorage on mount
  useEffect(() => {
    const loadTheme = () => {
      try {
        // First try to load from admin settings
        const adminSettings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        const adminTheme = adminSettings.appTheme;

        if (adminTheme) {
          setTheme(adminTheme);
          applyTheme(adminTheme);
          localStorage.setItem(THEME_KEY, adminTheme);
          return;
        }

        // Fallback to theme-specific storage
        const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
        setTheme(savedTheme);
        applyTheme(savedTheme);
      } catch (error) {
        console.warn("Failed to load theme setting:", error);
        setTheme("dark");
        applyTheme("dark");
      }
    };

    loadTheme();

    // Listen for storage changes (when settings are updated in another tab/window)
    const handleStorageChange = () => {
      loadTheme();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Watch for admin settings updates
  useEffect(() => {
    const handleSettingsUpdate = () => {
      try {
        const adminSettings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        const adminTheme = adminSettings.appTheme;

        if (adminTheme && adminTheme !== theme) {
          setTheme(adminTheme);
          applyTheme(adminTheme);
          localStorage.setItem(THEME_KEY, adminTheme);
        }
      } catch (error) {
        console.warn("Failed to reload theme setting:", error);
      }
    };

    window.addEventListener("admin-settings-updated", handleSettingsUpdate);
    return () => window.removeEventListener("admin-settings-updated", handleSettingsUpdate);
  }, [theme]);

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

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);

    // Update admin settings
    try {
      const adminSettings = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      adminSettings.appTheme = newTheme;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(adminSettings));
      // Emit event for other components to sync
      window.dispatchEvent(new Event("admin-settings-updated"));
    } catch (error) {
      console.warn("Failed to update admin theme setting:", error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
