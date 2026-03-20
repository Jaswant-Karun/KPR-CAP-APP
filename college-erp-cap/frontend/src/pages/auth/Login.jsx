import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { FaUserGraduate, FaChalkboardTeacher, FaEnvelope, FaLock } from "react-icons/fa";
import "./Login.css";

export default function Login() {
  const { login, loading } = useAuth();
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    // The login function in AuthContext expects credentials. 
    // We are passing role as well, though the backend might deduce it or we use it for client-side hint. 
    // Assuming backend handles role validation or just credential check.
    login({ email, password, role });
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
          <p className="text-gray-500">Sign in to your KPR ERP account</p>
        </div>

        {/* Role Toggle */}
        <div className="role-toggle-container">
          <div className="role-toggle">
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
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              placeholder={role === "student" ? "Student Email" : "Faculty Email"}
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

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} KPR Institute. All rights reserved.
        </p>
      </div>
    </div>
  );
}
