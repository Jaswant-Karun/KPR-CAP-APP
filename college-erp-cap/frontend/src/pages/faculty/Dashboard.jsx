import React from 'react';
import FacultyLayout from '../../layouts/FacultyLayout';
import Card from '../../components/ui/Card';
import './Dashboard.css';

export default function Dashboard() {
  return (
    <FacultyLayout>
      <h1 className="text-2xl font-bold mb-4">Faculty Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <Card>Classes Today</Card>
        <Card>Pending Attendance</Card>
        <Card>Reports</Card>
      </div>
    </FacultyLayout>
  );
}
