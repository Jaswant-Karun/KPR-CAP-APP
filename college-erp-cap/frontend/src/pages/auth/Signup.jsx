import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { usePublicSettings } from "../../hooks/usePublicSettings";
import {
  FaArrowRight,
  FaBuilding,
  FaEnvelope,
  FaIdCard,
  FaLock,
  FaUser,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaUserShield,
} from "react-icons/fa";
import "./AuthPage.css";

export default function Signup() {
  const { signup, loading } = useAuth();
  const { settings } = usePublicSettings();
  const [role, setRole] = useState("student");
  const [form, setForm] = useState({
    name: "",
    rollNo: "",
    department: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const isCollegeEmail = (value) => /^[a-zA-Z0-9._%+-]+@kpriet\.ac\.in$/i.test(value);
  const isStrongPassword = (value) => {
    const hasMinLength = value.length >= 8;
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasDigit = /\d/.test(value);
    const hasSpecial = /[^A-Za-z0-9]/.test(value);

    return hasMinLength && hasUpper && hasLower && hasDigit && hasSpecial;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedEmail = form.email.trim().toLowerCase();
    const normalizedRoll = form.rollNo.trim().toLowerCase();

    if (!isCollegeEmail(normalizedEmail)) {
      setError("Only @kpriet.ac.in email is allowed");
      return;
    }

    if (normalizedEmail.split("@")[0] !== normalizedRoll) {
      setError("Email username must match roll number. Example: 24cb023@kpriet.ac.in");
      return;
    }

    const isStrongPasswordEnabled = settings?.enforceStrongPassword ?? true;
    if (isStrongPasswordEnabled && !isStrongPassword(form.password)) {
      setError("Password must include 8+ chars, uppercase, lowercase, number and special character");
      return;
    }

    const isStudentSignupAllowed = settings?.allowStudentSignup ?? true;
    const isFacultySignupAllowed = settings?.allowFacultySignup ?? true;

    if (role === "student" && !isStudentSignupAllowed) {
      setError("Student signup is currently disabled by admin");
      return;
    }

    if (role === "faculty" && !isFacultySignupAllowed) {
      setError("Faculty signup is currently disabled by admin");
      return;
    }

    setError("");
    await signup({
      name: form.name.trim(),
      rollNo: form.rollNo.trim(),
      department: form.department.trim(),
      email: normalizedEmail,
      password: form.password,
      role,
    });
  };

  return (
    <div className="auth-shell">
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <p className="auth-chip">KPRIET Student and Staff Portal</p>
          <h2>Create Account</h2>
          <p>Use your official KPRIET email to register your CAP account.</p>
        </div>

        <div className="role-toggle-container">
          <div className="role-toggle" role="tablist" aria-label="Select role">
            <button
              className={`role-btn ${role === "student" ? "active" : ""}`}
              onClick={() => setRole("student")}
              type="button"
              disabled={!(settings?.allowStudentSignup ?? true)}
            >
              <FaUserGraduate className="mb-1 text-xl" />
              <span>Student</span>
            </button>
            <button
              className={`role-btn ${role === "faculty" ? "active" : ""}`}
              onClick={() => setRole("faculty")}
              type="button"
              disabled={!(settings?.allowFacultySignup ?? true)}
            >
              <FaChalkboardTeacher className="mb-1 text-xl" />
              <span>Faculty</span>
            </button>
            <button
              className={`role-btn ${role === "admin" ? "active" : ""}`}
              onClick={() => setRole("admin")}
              type="button"
            >
              <FaUserShield className="mb-1 text-xl" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="auth-grid-two">
            <div className="input-group">
              <FaUser className="input-icon" />
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                className="login-input"
                required
              />
            </div>

            <div className="input-group">
              <FaIdCard className="input-icon" />
              <input
                type="text"
                name="rollNo"
                placeholder="Roll No / ID"
                value={form.rollNo}
                onChange={handleChange}
                className="login-input"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <FaBuilding className="input-icon" />
            <input
              type="text"
              name="department"
              placeholder="Department"
              value={form.department}
              onChange={handleChange}
              className="login-input"
              required
            />
          </div>

          <div className="input-group">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              name="email"
              placeholder="rollno@kpriet.ac.in"
              value={form.email}
              onChange={handleChange}
              className="login-input"
              required
            />
          </div>

          <div className="input-group">
            <FaLock className="input-icon" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="login-input"
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <p className="auth-help">
            Mail must end with @kpriet.ac.in and should begin with the same value as Roll No.
            {(settings?.enforceStrongPassword ?? true)
              ? " Password must include uppercase, lowercase, number and special character."
              : " Password complexity is currently relaxed by admin."}
          </p>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"} <FaArrowRight />
          </button>

        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
