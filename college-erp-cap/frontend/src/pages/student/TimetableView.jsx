import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { getTodayTimetable, getWeeklyTimetable } from "../../services/timetableService";
import { getFacultyDirectory } from "../../services/facultyService";
import "./TimetableView.css";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const isSivasankariFaculty = (faculty = {}) => {
  const name = String(faculty?.name || "").toLowerCase();
  const email = String(faculty?.email || "").toLowerCase();
  const code = String(faculty?.roll_no || "").toLowerCase();

  return (
    name.includes("sivasankari") ||
    email.includes("cb003@kpriet.ac.in") ||
    email.includes("sivasankari") ||
    code.includes("cb003") ||
    code.includes("cb005")
  );
};

export default function TimetableView() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [todayRows, setTodayRows] = useState([]);
  const [weekRows, setWeekRows] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState("");
  const [viewMode, setViewMode] = useState("overall");
  const [currentDay, setCurrentDay] = useState(new Date().getDay());
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
          const preferredFaculty = list.find(isSivasankariFaculty) || list[0];
          setSelectedFacultyId(String(preferredFaculty.id));
        }
      } catch {
        // keep timetable loading functional even if faculty directory fails
      }
    };

    loadFaculty();
  }, [token, selectedFacultyId]);

  useEffect(() => {
    const fetchTimetable = async () => {
      console.log("TimetableView - fetchTimetable called", {
        userId: user?.id,
        hasToken: !!token,
        selectedFacultyId,
      });

      if (!user?.id || !token) {
        console.log("TimetableView - guard failed, skipping fetch");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        console.log("TimetableView - fetching timetable", {
          studentId: user.id,
          facultyId: selectedFacultyId || "undefined (will use backend fallback)",
        });

        const [todayRes, weekRes] = await Promise.all([
          getTodayTimetable("student", user.id, token, selectedFacultyId || undefined),
          getWeeklyTimetable("student", user.id, token, selectedFacultyId || undefined),
        ]);

        console.log("TimetableView - API responses:", {
          todayRes,
          weekRes,
          weekRowsCount: weekRes?.timetable?.length || 0,
        });

        setCurrentDay(todayRes?.dayOfWeek ?? new Date().getDay());
        setTodayRows(todayRes?.periods || []);
        setWeekRows(weekRes?.timetable || []);
      } catch (err) {
        console.error("TimetableView - fetch error:", err);
        setError(err?.message || "Unable to load timetable");
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();

    const interval = window.setInterval(() => {
      fetchTimetable();
    }, 60000);

    return () => window.clearInterval(interval);
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
    <div className="timetable-page">
      <button type="button" className="feature-back-btn" onClick={() => navigate("/student/dashboard")}>
        <FaArrowLeft /> Back
      </button>
      <h1 className="timetable-title">Automatic Day-wise Timetable</h1>
      <p className="timetable-subtitle">
        Today's schedule changes automatically by weekday ({DAY_LABELS[currentDay]}).
      </p>

      <div className="timetable-filter-row">
        <label className="timetable-filter-label">
          Faculty / Class Timetable
          <select
            className="timetable-filter-select"
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

        <div className="timetable-view-switch" role="tablist" aria-label="Timetable view mode">
          <button
            type="button"
            className={`switch-btn ${viewMode === "today" ? "active" : ""}`}
            onClick={() => setViewMode("today")}
          >
            Today's Timetable
          </button>
          <button
            type="button"
            className={`switch-btn ${viewMode === "overall" ? "active" : ""}`}
            onClick={() => setViewMode("overall")}
          >
            Overall Timetable
          </button>
        </div>
      </div>

      {loading && <p className="timetable-state">Loading timetable...</p>}
      {error && <p className="timetable-error">{error}</p>}

      {!loading && !error && (
        <>
          {viewMode === "today" ? (
            <section className="today-box">
              <h2 className="today-title">Today's Classes ({DAY_LABELS[currentDay]})</h2>
              {todayRows.length === 0 ? (
                <p className="timetable-empty">No classes scheduled for today.</p>
              ) : (
                <ul className="period-list">
                  {todayRows.map((row) => (
                    <li key={row.id}>
                      <span className="period-label">P{row.periodNo}</span>
                      <span className="period-subject">{row.subjectName}</span>
                      <span className="time-chip">{row.startTime || "--"} - {row.endTime || "--"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : (
            <div className="timetable-grid">
              {Array.from(groupedByDay.entries()).map(([day, rows]) => (
                <div key={day} className="timetable-day">
                  <h2 className="timetable-day-title">{day}</h2>
                  <ul className="timetable-day-list">
                    {rows.map((row) => (
                      <li key={row.id}>
                        <span className="period-label">P{row.periodNo}</span>
                        <span className="period-subject">{row.subjectName}</span>
                        <span className="time-chip">{row.startTime || "--"} - {row.endTime || "--"}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
