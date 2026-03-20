import React from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import './IFAC.css';

export default function IFAC() {
  const services = ['Internal Facility Booking', 'Lab Equipment'];

  return (
    <StudentLayout>
      <h1 className="text-2xl font-bold mb-4">Internal Facility Access Center</h1>
      <ul className="ifac-list">
        {services.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </StudentLayout>
  );
}
