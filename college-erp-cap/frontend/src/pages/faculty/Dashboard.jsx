import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiBarChart2,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiClipboard,
  FiUsers,
} from 'react-icons/fi';
import './Dashboard.css';

export default function Dashboard() {
  const quickStats = [
    {
      label: 'Class Strength',
      value: '75',
      helper: 'Total active students in your class',
      tone: 'students',
      to: '/faculty/reports',
      cta: 'View Reports',
      icon: FiUsers,
    },
    {
      label: 'Attendance Control',
      value: 'Ready',
      helper: 'Mark and review attendance in one click',
      tone: 'ready',
      to: '/faculty/attendance',
      cta: 'Open Attendance',
      icon: FiCheckCircle,
    },
    {
      label: 'Timetable Status',
      value: 'Editable',
      helper: 'Update period slots when needed',
      tone: 'editable',
      to: '/faculty/schedule',
      cta: 'Edit Timetable',
      icon: FiCalendar,
    },
  ];

  const actionItems = [
    {
      title: 'Take Attendance',
      text: 'Start attendance entry for your first period and lock records securely.',
      to: '/faculty/attendance',
      cta: 'Open Attendance',
      icon: FiClipboard,
    },
    {
      title: 'Review Reports',
      text: 'Check weekly absentee summary and identify students requiring follow-up.',
      to: '/faculty/reports',
      cta: 'Open Reports',
      icon: FiBarChart2,
    },
    {
      title: 'Update Timetable',
      text: 'Adjust period allocations for special sessions and lab substitutions.',
      to: '/faculty/schedule',
      cta: 'Open Timetable',
      icon: FiBookOpen,
    },
  ];

  return (
    <div className="faculty-page-wrap">
      <section className="faculty-hero">
        <div className="faculty-hero-content">
          <p className="faculty-kicker">Faculty Management Console</p>
          <h1 className="faculty-title">Faculty Dashboard</h1>
          <p className="faculty-subtitle">
            Manage attendance, scheduling, and class planning with a clean and focused workspace.
          </p>
        </div>

        <div className="faculty-day-pill">
          <p className="faculty-day-label">Today</p>
          <p className="faculty-day-value">4 Active Periods</p>
          <span className="faculty-day-meta">2 Tasks Pending Review</span>
        </div>
      </section>

      <section className="faculty-card-grid" aria-label="Quick faculty metrics">
        {quickStats.map((item) => (
          <Link key={item.label} className={`faculty-card faculty-card-${item.tone} faculty-card-link`} to={item.to}>
            <div className="faculty-card-icon-wrap">
              <item.icon className="faculty-card-icon" aria-hidden="true" />
            </div>
            <p className="faculty-card-label">{item.label}</p>
            <p className="faculty-card-value">{item.value}</p>
            <p className="faculty-card-helper">{item.helper}</p>
            <span className="faculty-card-cta">{item.cta}</span>
          </Link>
        ))}
      </section>

      <section className="faculty-action-panel" aria-label="Suggested actions">
        <h2 className="faculty-section-title">Continue Your Work</h2>
        <div className="faculty-action-list">
          {actionItems.map((item) => (
            <Link key={item.title} className="faculty-action-item" to={item.to}>
              <div className="faculty-action-icon-wrap">
                <item.icon className="faculty-action-icon" aria-hidden="true" />
              </div>
              <p className="faculty-action-title">{item.title}</p>
              <p className="faculty-action-text">{item.text}</p>
              <span className="faculty-action-cta">{item.cta}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
