import React from 'react';
import FacultyLayout from '../../layouts/FacultyLayout';
import './TimetableScheduler.css';

export default function TimetableScheduler() {
  const timetable = [
    { day: 'Monday', period: 'Math', room: '101' },
    { day: 'Tuesday', period: 'Physics', room: '102' },
    { day: 'Wednesday', period: 'CS Lab', room: '103' },
  ];

  return (
    <FacultyLayout>
      <h1 className="text-2xl font-bold mb-4">Timetable Scheduler</h1>
      <table className="timetable-table">
        <thead>
          <tr>
            <th>Day</th>
            <th>Period</th>
            <th>Room</th>
          </tr>
        </thead>
        <tbody>
          {timetable.map((t, i) => (
            <tr key={i}>
              <td>{t.day}</td>
              <td>{t.period}</td>
              <td>{t.room}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </FacultyLayout>
  );
}
