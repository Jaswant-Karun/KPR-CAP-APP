import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getWeeklyTimetable, saveWeeklyTimetable } from "../../services/timetableService";
import { FACULTY_DEFAULT_TIMETABLE } from "../../utils/facultyDefaultTimetable";
import "./TimetableScheduler.css";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const emptyRow = () => ({
  dayOfWeek: 1,
  periodNo: 1,
  subjectName: "",
  startTime: "",
  endTime: "",
  room: "",
  facultyName: "",
});

export default function TimetableScheduler() {
  const { user, token } = useAuth();
  const [rows, setRows] = useState([emptyRow()]);
  const [activeDay, setActiveDay] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadExisting = async () => {
      if (!user?.id || !token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await getWeeklyTimetable("faculty", user.id, token);
        const timetable = res?.timetable || [];
        if (timetable.length > 0) {
          setRows(
            timetable.map((item) => ({
              dayOfWeek: item.dayOfWeek,
              periodNo: item.periodNo,
              subjectName: item.subjectName,
              startTime: item.startTime || "",
              endTime: item.endTime || "",
              room: item.room || "",
              facultyName: item.facultyName || "",
            }))
          );
        } else {
          setRows(FACULTY_DEFAULT_TIMETABLE.map((row) => ({ ...row })));
          setMessage("Full timetable loaded. You can edit and save now.");
        }
      } catch (err) {
        setMessage(err?.message || "Could not load timetable");
      } finally {
        setLoading(false);
      }
    };

    loadExisting();
  }, [user?.id, token]);

  const addRow = () => {
    const nextRow = emptyRow();
    if (activeDay !== "all") {
      nextRow.dayOfWeek = Number(activeDay);
    }
    setRows((prev) => [...prev, nextRow]);
  };

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateRow = (index, field, value) => {
    setRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row))
    );
  };

  const normalizedRows = useMemo(() => {
    return rows
      .filter((row) => row.subjectName.trim() !== "")
      .map((row) => ({
        ...row,
        dayOfWeek: Number(row.dayOfWeek),
        periodNo: Number(row.periodNo),
      }));
  }, [rows]);

  const visibleRows = useMemo(() => {
    if (activeDay === "all") return rows;
    return rows.filter((row) => Number(row.dayOfWeek) === Number(activeDay));
  }, [activeDay, rows]);

  const handleLoadProvidedTimetable = () => {
    setRows(FACULTY_DEFAULT_TIMETABLE);
    setMessage("Timetable from your provided sheet is loaded. You can edit and save any day/period.");
  };

  const handleSave = async () => {
    if (!user?.id || !token) return;

    try {
      setSaving(true);
      setMessage("");

      await saveWeeklyTimetable(
        {
          audienceType: "faculty",
          audienceId: user.id,
          entries: normalizedRows,
        },
        token
      );

      setMessage("Timetable saved successfully. Student day-wise schedule will now update automatically.");
    } catch (err) {
      setMessage(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="faculty-page-wrap timetable-page-wrap">
      <h1 className="faculty-title">Editable Timetable Scheduler</h1>
      <p className="faculty-subtitle">Schedule each day period-wise and edit anytime. Students will get day-wise timetable automatically.</p>

      {message && <p className="timetable-message">{message}</p>}
      {loading && <p>Loading...</p>}

      {!loading && (
        <>
          <div className="timetable-toolbar">
            <label>
              Editing Day
              <select value={activeDay} onChange={(e) => setActiveDay(e.target.value)}>
                <option value="all">All Days</option>
                {DAYS.map((day, dayIndex) => (
                  <option key={day} value={dayIndex}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <table className="timetable-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Period</th>
                <th>Subject</th>
                <th>Start</th>
                <th>End</th>
                <th>Room</th>
                <th>Faculty</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                const index = rows.indexOf(row);

                return (
                <tr key={`${row.dayOfWeek}-${row.periodNo}-${index}`}>
                  <td>
                    <select value={row.dayOfWeek} onChange={(e) => updateRow(index, "dayOfWeek", e.target.value)}>
                      {DAYS.map((day, dayIndex) => (
                        <option key={day} value={dayIndex}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      value={row.periodNo}
                      onChange={(e) => updateRow(index, "periodNo", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={row.subjectName}
                      placeholder="Subject"
                      onChange={(e) => updateRow(index, "subjectName", e.target.value)}
                    />
                  </td>
                  <td>
                    <input type="text" value={row.startTime} onChange={(e) => updateRow(index, "startTime", e.target.value)} />
                  </td>
                  <td>
                    <input type="text" value={row.endTime} onChange={(e) => updateRow(index, "endTime", e.target.value)} />
                  </td>
                  <td>
                    <input type="text" value={row.room} onChange={(e) => updateRow(index, "room", e.target.value)} />
                  </td>
                  <td>
                    <input type="text" value={row.facultyName} onChange={(e) => updateRow(index, "facultyName", e.target.value)} />
                  </td>
                  <td>
                    <button type="button" onClick={() => removeRow(index)} className="danger-btn">
                      Remove
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>

          <div className="timetable-action-row">
            <button type="button" className="primary-btn" onClick={handleLoadProvidedTimetable}>
              Load Timetable From Sheet
            </button>
            <button type="button" className="primary-btn" onClick={addRow}>
              Add Period
            </button>
            <button type="button" className="primary-btn" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Weekly Timetable"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
