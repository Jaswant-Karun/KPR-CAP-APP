import React, { createContext, useState } from "react";

// Context for student-specific data
export const StudentContext = createContext();

export const StudentProvider = ({ children }) => {
  const [attendance, setAttendance] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [downloads, setDownloads] = useState([]);

  const updateAttendance = (data) => setAttendance(data);
  const updateTimetable = (data) => setTimetable(data);
  const updateDownloads = (data) => setDownloads(data);

  return (
    <StudentContext.Provider
      value={{
        attendance,
        timetable,
        downloads,
        updateAttendance,
        updateTimetable,
        updateDownloads,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
};
