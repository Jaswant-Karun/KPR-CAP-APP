import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './PerformanceChart.css';

export default function PerformanceChart() {
  // Sample data
  const data = [
    { month: 'Jan', Score: 85 },
    { month: 'Feb', Score: 88 },
    { month: 'Mar', Score: 90 },
    { month: 'Apr', Score: 92 },
    { month: 'May', Score: 95 },
    { month: 'Jun', Score: 93 },
  ];

  return (
    <div className="chart-container">
      <h2 className="chart-title">Performance Trend</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis unit="%" />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="Score" stroke="#10b981" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
