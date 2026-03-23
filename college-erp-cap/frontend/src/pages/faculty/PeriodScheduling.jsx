import React from 'react';
import './PeriodScheduling.css';

export default function PeriodScheduling() {
  const schedule = [
    { day: 'Monday', period: 'Period 1 to 7', time: '08:55 AM to 04:15 PM' },
    { day: 'Tuesday', period: 'Period 1 to 7', time: '08:55 AM to 04:15 PM' },
    { day: 'Wednesday', period: 'Period 1 to 7', time: '08:55 AM to 04:15 PM' },
    { day: 'Thursday', period: 'Period 1 to 7', time: '08:55 AM to 04:15 PM' },
    { day: 'Friday', period: 'Period 1 to 7', time: '08:55 AM to 04:15 PM' },
    { day: 'Saturday', period: 'Activity / Special Schedule', time: 'As assigned' },
  ];

  return (
    <div className="faculty-page-wrap">
      <h1 className="faculty-title">Period Scheduling</h1>
      <p className="faculty-subtitle">Use this as the day-wise view. For editing each day periods, open Editable Timetable.</p>
      <ul className="schedule-list">
        {schedule.map((item, i) => (
          <li key={i}>{item.day} - {item.period} ({item.time})</li>
        ))}
      </ul>
    </div>
  );
}
