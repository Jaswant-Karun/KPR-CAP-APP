import React from 'react';
import { Link } from 'react-router-dom';
import './Unauthorized.css';

export default function Unauthorized() {
  return (
    <div className="error-page">
      <h1 className="error-code">401</h1>
      <p className="error-message">Unauthorized Access</p>
      <Link to="/" className="error-link">Go to Dashboard</Link>
    </div>
  );
}
