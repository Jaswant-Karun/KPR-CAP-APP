import React from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import './NDC.css';

export default function NDC() {
  const services = ['Notifications', 'Daily Circular', 'Announcements'];

  return (
    <StudentLayout>
      <h1 className="text-2xl font-bold mb-4">NDC</h1>
      <ul className="ndc-list">
        {services.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </StudentLayout>
  );
}
