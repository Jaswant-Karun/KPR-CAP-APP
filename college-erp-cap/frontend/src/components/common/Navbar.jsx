import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/images/logo.png';

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between bg-blue-600 p-4 text-white">
      <div className="flex items-center gap-2">
        <img src={logo} alt="Logo" className="h-8 w-8" />
        <span className="font-bold">College ERP</span>
      </div>
      <div className="flex gap-4">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/profile">Profile</Link>
      </div>
    </nav>
  );
}
