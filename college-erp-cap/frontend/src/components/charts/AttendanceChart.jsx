import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts';
import './AttendanceChart.css';

export default function AttendanceChart() {
  // Sample data
  const data = [
    { name: 'Math', Attendance: 80 },
    { name: 'Physics', Attendance: 75 },
    { name: 'Chemistry', Attendance: 90 },
    { name: 'English', Attendance: 85 },
    { name: 'CS', Attendance: 95 },
  ];

  return (
    <div className="chart-container">
      <h2 className="chart-title">Attendance Overview</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis unit="%" />
          <Tooltip />
          <Legend />
          <Bar dataKey="Attendance" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
