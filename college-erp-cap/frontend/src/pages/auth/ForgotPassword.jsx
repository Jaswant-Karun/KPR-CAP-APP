import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>🔐 Forgot Password</h1>
        <p style={styles.subtitle}>
          Enter your registered email to reset your password
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <div style={styles.inputGroup}>
              <span style={styles.icon}>✉️</span>
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            <button type="submit" style={styles.button}>
              📩 Send Reset Link
            </button>
          </form>
        ) : (
          <div style={styles.successBox}>
            ✅ Password reset link sent! <br />
            Please check your email.
          </div>
        )}

        <p style={styles.footer}>
          🎓 College ERP System
        </p>
      </div>
    </div>
  );
}

/* ================== STYLES ================== */

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background:
      "linear-gradient(135deg, #1e3c72, #2a5298, #38bdf8)",
    fontFamily: "Segoe UI, sans-serif",
  },

  card: {
    width: "420px",
    background: "#ffffff",
    padding: "35px",
    borderRadius: "20px",
    boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
    textAlign: "center",
  },

  title: {
    fontSize: "30px",
    marginBottom: "10px",
    color: "#1e293b",
  },

  subtitle: {
    fontSize: "16px",
    color: "#475569",
    marginBottom: "30px",
  },

  inputGroup: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #cbd5f5",
    borderRadius: "50px",
    padding: "12px 18px",
    marginBottom: "25px",
  },

  icon: {
    fontSize: "18px",
    marginRight: "10px",
  },

  input: {
    border: "none",
    outline: "none",
    fontSize: "16px",
    width: "100%",
  },

  button: {
    width: "100%",
    padding: "14px",
    fontSize: "17px",
    borderRadius: "50px",
    border: "none",
    cursor: "pointer",
    background:
      "linear-gradient(90deg, #2563eb, #38bdf8)",
    color: "#ffffff",
    fontWeight: "bold",
    transition: "0.3s",
  },

  successBox: {
    background: "#ecfeff",
    color: "#0f766e",
    padding: "20px",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "500",
  },

  footer: {
    marginTop: "30px",
    fontSize: "14px",
    color: "#64748b",
  },
};
