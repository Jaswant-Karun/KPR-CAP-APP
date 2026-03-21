import React from 'react';

export default function MainGate() {
  const passes = ['Entry Pass', 'Exit Pass', 'Visitor Pass'];

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fadeIn">
      <h1 className="text-2xl font-bold mb-4">Main Gate Pass</h1>
      <ul className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        {passes.map((p, i) => (
          <li key={i} className="py-2 border-b border-slate-100 last:border-0">{p}</li>
        ))}
      </ul>
    </div>
  );
}
