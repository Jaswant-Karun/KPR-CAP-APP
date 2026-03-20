import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="error-page">
      <h1 className="error-code">404</h1>
      <p className="error-message">Oops! Page Not Found.</p>
      <Link to="/" className="error-link">Go to Dashboard</Link>
    </div>
  );
}
