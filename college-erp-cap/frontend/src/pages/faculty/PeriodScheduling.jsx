import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getTodayTimetable, getWeeklyTimetable } from '../../services/timetableService';
import './PeriodScheduling.css';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function PeriodScheduling() {
  const { user, token } = useAuth();
  const [todayRows, setTodayRows] = useState([]);
  const [weekRows, setWeekRows] = useState([]);
  const [currentDay, setCurrentDay] = useState(new Date().getDay());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSchedule = async () => {
      if (!user?.id || !token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const [todayRes, weekRes] = await Promise.all([
          getTodayTimetable('faculty', user.id, token),
          getWeeklyTimetable('faculty', user.id, token),
        ]);

        setCurrentDay(todayRes?.dayOfWeek ?? new Date().getDay());
        setTodayRows(todayRes?.periods || []);
        setWeekRows(weekRes?.timetable || []);
      } catch (err) {
        setError(err?.message || 'Unable to load schedule');
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, [user?.id, token]);

  const weekSummary = useMemo(() => {
    const byDay = new Map();
    weekRows.forEach((row) => {
      const day = DAY_LABELS[row.dayOfWeek] || 'Unknown';
      if (!byDay.has(day)) {
        byDay.set(day, { count: 0, first: row.startTime || '--', last: row.endTime || '--' });
      }
      const current = byDay.get(day);
      current.count += 1;
      if (row.startTime && (current.first === '--' || row.startTime < current.first)) {
        current.first = row.startTime;
      }
      if (row.endTime && (current.last === '--' || row.endTime > current.last)) {
        current.last = row.endTime;
      }
      byDay.set(day, current);
    });
    return Array.from(byDay.entries());
  }, [weekRows]);

  return (
    <div className="faculty-page-wrap">
      <h1 className="faculty-title">Period Scheduling</h1>
      <p className="faculty-subtitle">Live day-wise schedule from timetable data. Update periods in Editable Timetable.</p>

      {loading && <p className="faculty-subtitle">Loading schedule...</p>}
      {error && <p className="faculty-subtitle">{error}</p>}

      {!loading && !error && (
        <>
          <ul className="schedule-list">
            <li>
              <strong>Today ({DAY_LABELS[currentDay]})</strong>: {todayRows.length > 0 ? `${todayRows.length} periods` : 'No periods scheduled'}
            </li>
            {todayRows.map((row) => (
              <li key={row.id}>
                P{row.periodNo} - {row.subjectName} ({row.startTime || '--'} to {row.endTime || '--'})
              </li>
            ))}
          </ul>

          <ul className="schedule-list" style={{ marginTop: '0.9rem' }}>
            {weekSummary.length === 0 ? (
              <li>No weekly timetable saved yet.</li>
            ) : (
              weekSummary.map(([day, summary]) => (
                <li key={day}>{day} - {summary.count} periods ({summary.first} to {summary.last})</li>
              ))
            )}
          </ul>
        </>
      )}
    </div>
  );
}
