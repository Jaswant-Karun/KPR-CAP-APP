import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';

export default function StudentLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar fixed or static on the left */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 p-0 overflow-y-auto h-screen">
        <Outlet />
      </main>
    </div>
  );
}
