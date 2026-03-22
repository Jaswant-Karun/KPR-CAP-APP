import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getWeeklyTimetable, saveWeeklyTimetable } from "../../services/timetableService";
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
    setRows((prev) => [...prev, emptyRow()]);
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
    <div>
      <h1 className="text-2xl font-bold mb-2">Automatic Timetable Scheduler</h1>
      <p className="text-gray-500 mb-4">Enter full weekly timetable. The system automatically serves the right day schedule.</p>

      {message && <p className="mb-3 text-sm text-blue-700">{message}</p>}
      {loading && <p>Loading...</p>}

      {!loading && (
        <>
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
              {rows.map((row, index) => (
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
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex gap-3">
            <button type="button" className="primary-btn" onClick={addRow}>
              Add Row
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
