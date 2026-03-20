import React from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import './TimetableView.css';

export default function TimetableView() {
  const timetable = [
    { day: 'Monday', periods: ['Math', 'Physics', 'Chemistry'] },
    { day: 'Tuesday', periods: ['English', 'CS', 'Lab'] },
    { day: 'Wednesday', periods: ['Math', 'Physics', 'CS'] },
  ];

  return (
    <StudentLayout>
      <h1 className="text-2xl font-bold mb-4">Timetable</h1>
      <div className="timetable-grid">
        {timetable.map((item, index) => (
          <div key={index} className="timetable-day">
            <h2 className="font-bold mb-2">{item.day}</h2>
            <ul>
              {item.periods.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </StudentLayout>
  );
}
