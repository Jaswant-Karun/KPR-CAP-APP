import React from 'react';

export default function Input({ label, ...props }) {
  return (
    <div className="flex flex-col mb-4">
      {label && <label className="mb-1">{label}</label>}
      <input {...props} className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
    </div>
  );
}
