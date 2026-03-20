import React from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import './StudentService.css';

export default function StudentService() {
  const services = ['Library Issue', 'ID Card Request', 'Complaint Submission'];

  return (
    <StudentLayout>
      <h1 className="text-2xl font-bold mb-4">Student Services</h1>
      <ul className="service-list">
        {services.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </StudentLayout>
  );
}
