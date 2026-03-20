import React from 'react';
import FacultyLayout from '../../layouts/FacultyLayout';
import './StudentAttendance.css';

export default function StudentAttendance() {
  const attendanceRecords = [
    { name: 'John Doe', roll: '123', percentage: 90 },
    { name: 'Jane Smith', roll: '124', percentage: 85 },
    { name: 'Alice Brown', roll: '125', percentage: 95 },
  ];

  return (
    <FacultyLayout>
      <h1 className="text-2xl font-bold mb-4">Student Attendance Records</h1>
      <table className="attendance-records-table">
        <thead>
          <tr>
            <th>Roll No</th>
            <th>Name</th>
            <th>Attendance %</th>
          </tr>
        </thead>
        <tbody>
          {attendanceRecords.map((s, i) => (
            <tr key={i}>
              <td>{s.roll}</td>
              <td>{s.name}</td>
              <td>{s.percentage}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </FacultyLayout>
  );
}
