import React from 'react';

export default function NDC() {
  const services = ['Notifications', 'Daily Circular', 'Announcements'];

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fadeIn">
      <h1 className="text-2xl font-bold mb-4">NDC</h1>
      <ul className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        {services.map((item, i) => (
          <li key={i} className="py-2 border-b border-slate-100 last:border-0">{item}</li>
        ))}
      </ul>
    </div>
  );
}
