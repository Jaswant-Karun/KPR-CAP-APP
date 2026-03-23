import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getTodayTimetable, getWeeklyTimetable } from "../../services/timetableService";
import { getFacultyDirectory } from "../../services/facultyService";
import "./TimetableView.css";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TimetableView() {
  const { user, token } = useAuth();
  const [todayRows, setTodayRows] = useState([]);
  const [weekRows, setWeekRows] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadFaculty = async () => {
      if (!token) return;
      try {
        const res = await getFacultyDirectory(token);
        const list = res?.faculty || [];
        setFacultyList(list);
        if (!selectedFacultyId && list.length > 0) {
          setSelectedFacultyId(String(list[0].id));
        }
      } catch {
        // keep timetable loading functional even if faculty directory fails
      }
    };

    loadFaculty();
  }, [token, selectedFacultyId]);

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
          getTodayTimetable("student", user.id, token, selectedFacultyId || undefined),
          getWeeklyTimetable("student", user.id, token, selectedFacultyId || undefined),
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
  }, [user?.id, token, selectedFacultyId]);

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

      <div className="mb-5">
        <label className="text-sm font-semibold text-slate-600">
          Faculty / Class Timetable
          <select
            className="ml-3 border border-slate-300 rounded px-3 py-1.5"
            value={selectedFacultyId}
            onChange={(e) => setSelectedFacultyId(e.target.value)}
          >
            {facultyList.length === 0 ? (
              <option value="">Default</option>
            ) : (
              facultyList.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name} ({faculty.department || "No Dept"})
                </option>
              ))
            )}
          </select>
        </label>
      </div>

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
