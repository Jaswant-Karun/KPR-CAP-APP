import "./logout.css";

function Logout() {
  return (
    <div className="logout-wrapper">
      <div className="logout-card">
        <h1 className="logout-title">
          🔒 Successfully Logged Out
        </h1>

        <p className="logout-message">
          You have been securely logged out of the  
          <strong> College ERP System</strong>.
        </p>

        <div className="logout-actions">
          <a href="/login" className="btn primary">
            🔑 Login Again
          </a>

          <a href="/" className="btn secondary">
            🏠 Go to Home
          </a>
        </div>

        <p className="logout-footer">
          Thank you for using the ERP system 🎓
        </p>
      </div>
    </div>
  );
}

export default Logout;
