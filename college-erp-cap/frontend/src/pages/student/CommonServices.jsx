import React from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import './CommonServices.css';

export default function CommonServices() {
  const services = ['Bus Pass', 'Cafeteria', 'Hostel Requests'];

  return (
    <StudentLayout>
      <h1 className="text-2xl font-bold mb-4">Common Services</h1>
      <ul className="service-list">
        {services.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </StudentLayout>
  );
}
