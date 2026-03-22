import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getTodayTimetable, getWeeklyTimetable } from "../../services/timetableService";
import "./TimetableView.css";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TimetableView() {
  const { user, token } = useAuth();
  const [todayRows, setTodayRows] = useState([]);
  const [weekRows, setWeekRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTimetable = async () => {
      if (!user?.id || !token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [todayRes, weekRes] = await Promise.all([
          getTodayTimetable("student", user.id, token),
          getWeeklyTimetable("student", user.id, token),
        ]);

        setTodayRows(todayRes?.periods || []);
        setWeekRows(weekRes?.timetable || []);
      } catch (err) {
        setError(err?.message || "Unable to load timetable");
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [user?.id, token]);

  const groupedByDay = useMemo(() => {
    const map = new Map();
    for (const row of weekRows) {
      const day = DAY_LABELS[row.dayOfWeek] || "Unknown";
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(row);
    }
    return map;
  }, [weekRows]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Automatic Day-wise Timetable</h1>
      <p className="text-gray-500 mb-6">Today's schedule is selected automatically based on the current day.</p>

      {loading && <p>Loading timetable...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          <section className="today-box">
            <h2 className="text-lg font-semibold mb-3">Today's Classes</h2>
            {todayRows.length === 0 ? (
              <p className="text-gray-500">No classes scheduled for today.</p>
            ) : (
              <ul className="period-list">
                {todayRows.map((row) => (
                  <li key={row.id}>
                    <strong>P{row.periodNo}</strong> {row.subjectName}
                    <span className="time-chip">{row.startTime || "--"} - {row.endTime || "--"}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="timetable-grid">
            {Array.from(groupedByDay.entries()).map(([day, rows]) => (
              <div key={day} className="timetable-day">
                <h2 className="font-bold mb-2">{day}</h2>
                <ul>
                  {rows.map((row) => (
                    <li key={row.id}>
                      P{row.periodNo} - {row.subjectName} ({row.startTime || "--"} - {row.endTime || "--"})
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
