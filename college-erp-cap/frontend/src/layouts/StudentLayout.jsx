import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';

export default function StudentLayout() {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <main className="flex-1 min-w-0 overflow-y-auto h-screen">
        <div className="min-h-full bg-gradient-to-br from-slate-100 via-slate-50 to-sky-50 p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
