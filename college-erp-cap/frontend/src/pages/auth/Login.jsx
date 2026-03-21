import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { FaUserGraduate, FaChalkboardTeacher, FaUserShield, FaEnvelope, FaLock, FaArrowRight } from "react-icons/fa";
import "./AuthPage.css";

export default function Login() {
  const { login, loading } = useAuth();
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const isCollegeEmail = (value) => /^[a-zA-Z0-9._%+-]+@kpriet\.ac\.in$/i.test(value);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!isCollegeEmail(email.trim())) {
      setError("Only @kpriet.ac.in email is allowed");
      return;
    }

    setError("");
    await login({ email: email.trim().toLowerCase(), password, role });
  };

  return (
    <div className="auth-shell">
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />
      <div className="auth-card">
        <div className="auth-header">
          <p className="auth-chip">KPRIET Combined Admin Panel</p>
          <h2>Welcome Back</h2>
          <p>Sign in with your institutional account to continue.</p>
        </div>

        <div className="role-toggle-container">
          <div className="role-toggle" role="tablist" aria-label="Select role">
            <button
              className={`role-btn ${role === "student" ? "active" : ""}`}
              onClick={() => setRole("student")}
              type="button"
            >
              <FaUserGraduate className="mb-1 text-xl" />
              <span>Student</span>
            </button>
            <button
              className={`role-btn ${role === "faculty" ? "active" : ""}`}
              onClick={() => setRole("faculty")}
              type="button"
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

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              placeholder="rollno@kpriet.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="login-input"
            />
          </div>

          <div className="input-group">
            <FaLock className="input-icon" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="login-input"
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <p className="auth-help">Only mail IDs ending with @kpriet.ac.in can login.</p>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"} <FaArrowRight />
          </button>
        </form>

        <p className="auth-switch">
          New to CAP? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
