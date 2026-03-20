import React from 'react';

export default function Footer() {
  return (
    <footer className="text-center p-4 text-gray-500">
      &copy; {new Date().getFullYear()} College ERP. All rights reserved.
    </footer>
  );
}
