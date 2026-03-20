import React from 'react';

export default function Card({ children, className }) {
  return (
    <div className={`bg-white shadow p-4 rounded ${className}`}>
      {children}
    </div>
  );
}
