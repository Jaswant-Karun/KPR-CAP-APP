import React from 'react';
import FacultyLayout from '../../layouts/FacultyLayout';
import './PeriodScheduling.css';

export default function PeriodScheduling() {
  const schedule = [
    { day: 'Monday', period: 'Math', time: '9-10AM' },
    { day: 'Tuesday', period: 'Physics', time: '10-11AM' },
    { day: 'Wednesday', period: 'CS Lab', time: '11-12AM' },
  ];

  return (
    <FacultyLayout>
      <h1 className="text-2xl font-bold mb-4">Period Scheduling</h1>
      <ul className="schedule-list">
        {schedule.map((item, i) => (
          <li key={i}>{item.day} - {item.period} ({item.time})</li>
        ))}
      </ul>
    </FacultyLayout>
  );
}
