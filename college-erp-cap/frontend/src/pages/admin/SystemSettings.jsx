import { useState } from "react";
import { useTheme } from "../../hooks/useTheme";
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
  const { toggleTheme } = useTheme();
  const [settings, setSettings] = useState(getInitial);
  const [message, setMessage] = useState("");

  const toggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const changeTheme = (newTheme) => {
    setSettings((prev) => ({ ...prev, appTheme: newTheme }));
  };

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    // Apply theme if it changed
    if (settings.appTheme) {
      toggleTheme(settings.appTheme);
    }
    // Emit custom event so other components can update
    window.dispatchEvent(new Event("admin-settings-updated"));
    setMessage("System settings saved successfully.");
  };

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
                className={`admin-btn ${settings.appTheme === "dark" ? "active" : ""}`} 
                type="button" 
                onClick={() => changeTheme("dark")}
                style={settings.appTheme === "dark" ? { background: "rgba(0, 196, 255, 0.25)", borderColor: "#00c4ff" } : {}}
              >
                Dark
              </button>
              <button 
                className={`admin-btn ${settings.appTheme === "light" ? "active" : ""}`} 
                type="button" 
                onClick={() => changeTheme("light")}
                style={settings.appTheme === "light" ? { background: "rgba(0, 196, 255, 0.25)", borderColor: "#00c4ff" } : {}}
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
