import React from 'react';
import Card from '../../components/ui/Card';
import './Dashboard.css';

export default function Dashboard() {
  return (
    <div className="faculty-page-wrap">
      <h1 className="faculty-title">Faculty Dashboard</h1>
      <p className="faculty-subtitle">Manage your class attendance, daily periods, and editable timetable from one place.</p>

      <div className="faculty-card-grid">
        <Card className="faculty-card">My Class Strength: 75 Students</Card>
        <Card className="faculty-card">Attendance Control: Ready</Card>
        <Card className="faculty-card">Timetable Scheduler: Editable</Card>
      </div>
    </div>
  );
}
