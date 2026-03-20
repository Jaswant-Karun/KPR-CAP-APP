import React, { createContext, useState } from "react";

// Context for faculty-specific data
export const FacultyContext = createContext();

export const FacultyProvider = ({ children }) => {
  const [students, setStudents] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [reports, setReports] = useState([]);

  const updateStudents = (data) => setStudents(data);
  const updateTimetable = (data) => setTimetable(data);
  const updateReports = (data) => setReports(data);

  return (
    <FacultyContext.Provider
      value={{
        students,
        timetable,
        reports,
        updateStudents,
        updateTimetable,
        updateReports,
      }}
    >
      {children}
    </FacultyContext.Provider>
  );
};
