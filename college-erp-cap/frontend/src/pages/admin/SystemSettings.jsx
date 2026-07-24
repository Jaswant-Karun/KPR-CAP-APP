import { useEffect, useState } from "react";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { getSystemSettings, updateSystemSettings } from "../../services/adminService";
import "./AdminPages.css";

const STORAGE_KEY = "kpr_admin_settings";

const getInitial = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      allowStudentSignup: stored.allowStudentSignup ?? true,
      allowFacultySignup: stored.allowFacultySignup ?? true,
      enforceStrongPassword: stored.enforceStrongPassword ?? true,
      maintenanceMode: stored.maintenanceMode ?? false,
      buttonSoundEnabled: stored.buttonSoundEnabled ?? true,
      appTheme: stored.appTheme ?? "dark",
      defaultDepartment: stored.defaultDepartment ?? "CSE",
    };
  } catch (error) {
    return {
      allowStudentSignup: true,
      allowFacultySignup: true,
      enforceStrongPassword: true,
      maintenanceMode: false,
      buttonSoundEnabled: true,
      appTheme: "dark",
      defaultDepartment: "CSE",
    };
  }
};

export default function SystemSettings() {
  const { token } = useAuth();
  const { toggleTheme } = useTheme();
  const [settings, setSettings] = useState(getInitial);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await getSystemSettings(token);
        const apiSettings = response?.settings;
        if (apiSettings) {
          setSettings((prev) => ({ ...prev, ...apiSettings }));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(apiSettings));
        }
      } catch (error) {
        console.warn("Failed to load system settings from backend:", error);
        setMessage("Unable to load latest settings from server. Showing local fallback values.");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [token]);

  const toggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const changeTheme = (newTheme) => {
    setSettings((prev) => ({ ...prev, appTheme: newTheme }));
  };

  const save = async () => {
    if (!token) {
      setMessage("You are not authenticated. Please log in again.");
      return;
    }

    try {
      const response = await updateSystemSettings(settings, token);
      const savedSettings = response?.settings || settings;

      setSettings(savedSettings);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSettings));

      if (savedSettings.appTheme) {
        toggleTheme(savedSettings.appTheme);
      }

      window.dispatchEvent(
        new CustomEvent("admin-settings-updated", {
          detail: savedSettings,
        })
      );

      setMessage("System settings saved successfully.");
    } catch (error) {
      setMessage(error?.message || "Failed to save system settings.");
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">System Settings</h1>
        <p className="admin-page-subtitle">Loading system settings...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">System Settings</h1>
      <p className="admin-page-subtitle">Security, operational switches, and theme preferences for the entire ERP.</p>

      <section className="admin-panel">
        <div className="admin-grid">
          <article className="admin-stat-card">
            <p className="admin-stat-label">Student Signup Access</p>
            <p className="admin-stat-value">{settings.allowStudentSignup ? "ON" : "OFF"}</p>
            <button className="admin-btn" type="button" onClick={() => toggle("allowStudentSignup")}>Toggle</button>
          </article>

          <article className="admin-stat-card">
            <p className="admin-stat-label">Faculty Signup Access</p>
            <p className="admin-stat-value">{settings.allowFacultySignup ? "ON" : "OFF"}</p>
            <button className="admin-btn" type="button" onClick={() => toggle("allowFacultySignup")}>Toggle</button>
          </article>

          <article className="admin-stat-card">
            <p className="admin-stat-label">Strong Password Enforcement</p>
            <p className="admin-stat-value">{settings.enforceStrongPassword ? "ON" : "OFF"}</p>
            <button className="admin-btn" type="button" onClick={() => toggle("enforceStrongPassword")}>Toggle</button>
          </article>

          <article className="admin-stat-card">
            <p className="admin-stat-label">Maintenance Mode</p>
            <p className="admin-stat-value">{settings.maintenanceMode ? "ON" : "OFF"}</p>
            <button className="admin-btn warn" type="button" onClick={() => toggle("maintenanceMode")}>Toggle</button>
          </article>

          <article className="admin-stat-card">
            <p className="admin-stat-label">Button Click Sounds</p>
            <p className="admin-stat-value">{settings.buttonSoundEnabled ? "ON" : "OFF"}</p>
            <button className="admin-btn" type="button" onClick={() => toggle("buttonSoundEnabled")}>Toggle</button>
          </article>

          <article className="admin-stat-card">
            <p className="admin-stat-label">Application Theme</p>
            <p className="admin-stat-value">{settings.appTheme.toUpperCase()}</p>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <button
                className={`admin-btn${settings.appTheme === "dark" ? " admin-btn-active" : ""}`}
                type="button"
                onClick={() => changeTheme("dark")}
              >
                Dark
              </button>
              <button
                className={`admin-btn${settings.appTheme === "light" ? " admin-btn-active" : ""}`}
                type="button"
                onClick={() => changeTheme("light")}
              >
                Light
              </button>
            </div>
          </article>
        </div>

        <div className="admin-toolbar" style={{ marginTop: "1rem" }}>
          <select
            className="admin-select"
            value={settings.defaultDepartment}
            onChange={(e) => setSettings((prev) => ({ ...prev, defaultDepartment: e.target.value }))}
          >
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="EEE">EEE</option>
            <option value="MECH">MECH</option>
            <option value="CIVIL">CIVIL</option>
          </select>
          <button className="admin-btn" type="button" onClick={save}>Save All Settings</button>
        </div>
      </section>

      {message && <p className="admin-message">{message}</p>}
    </div>
  );
}
