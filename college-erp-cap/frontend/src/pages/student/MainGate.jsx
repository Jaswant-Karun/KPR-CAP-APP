import React from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import './MainGate.css';

export default function MainGate() {
  const passes = ['Entry Pass', 'Exit Pass', 'Visitor Pass'];

  return (
    <StudentLayout>
      <h1 className="text-2xl font-bold mb-4">Main Gate Pass</h1>
      <ul className="pass-list">
        {passes.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
    </StudentLayout>
  );
}
