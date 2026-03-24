import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

export default function StudentService() {
  const navigate = useNavigate();
  const services = ['Library Issue', 'ID Card Request', 'Complaint Submission'];

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fadeIn">
      <button type="button" className="feature-back-btn" onClick={() => navigate("/student/dashboard")}>
        <FaArrowLeft /> Back
      </button>
      <h1 className="text-2xl font-bold mb-4">Student Services</h1>
      <ul className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        {services.map((s, i) => (
          <li key={i} className="py-2 border-b border-slate-100 last:border-0">{s}</li>
        ))}
      </ul>
    </div>
  );
}
