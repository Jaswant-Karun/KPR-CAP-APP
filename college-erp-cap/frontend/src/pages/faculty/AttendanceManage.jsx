import React from 'react';
import FacultyLayout from '../../layouts/FacultyLayout';
import './AttendanceManage.css';

export default function AttendanceManage() {
  const students = [
    { name: 'John Doe', roll: '123' },
    { name: 'Jane Smith', roll: '124' },
    { name: 'Alice Brown', roll: '125' },
  ];

  return (
    <FacultyLayout>
      <h1 className="text-2xl font-bold mb-4">Manage Attendance</h1>
      <table className="attendance-table">
        <thead>
          <tr>
            <th>Roll No</th>
            <th>Name</th>
            <th>Present</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s, i) => (
            <tr key={i}>
              <td>{s.roll}</td>
              <td>{s.name}</td>
              <td>
                <input type="checkbox" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </FacultyLayout>
  );
}
