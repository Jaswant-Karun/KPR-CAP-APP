import React from 'react';
import FacultyLayout from '../../layouts/FacultyLayout';
import './Reports.css';

export default function Reports() {
  const reports = ['Attendance Report', 'Exam Report', 'Course Report'];

  return (
    <FacultyLayout>
      <h1 className="text-2xl font-bold mb-4">Reports</h1>
      <ul className="report-list">
        {reports.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </FacultyLayout>
  );
}
