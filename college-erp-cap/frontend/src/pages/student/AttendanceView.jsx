import React from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import './AttendanceView.css';

export default function AttendanceView() {
  const attendance = [
    { subject: 'Math', attended: 20, total: 24 },
    { subject: 'Physics', attended: 18, total: 24 },
    { subject: 'Chemistry', attended: 22, total: 24 },
  ];

  return (
    <StudentLayout>
      <h1 className="text-2xl font-bold mb-4">Attendance</h1>
      <table className="attendance-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Attended</th>
            <th>Total Classes</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
          {attendance.map((item, index) => (
            <tr key={index}>
              <td>{item.subject}</td>
              <td>{item.attended}</td>
              <td>{item.total}</td>
              <td>{((item.attended / item.total) * 100).toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </StudentLayout>
  );
}
