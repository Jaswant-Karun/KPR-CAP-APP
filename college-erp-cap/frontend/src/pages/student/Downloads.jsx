import React from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import './Downloads.css';

export default function Downloads() {
  const files = [
    { name: 'Syllabus.pdf', link: '#' },
    { name: 'TimeTable.pdf', link: '#' },
    { name: 'ExamResults.pdf', link: '#' },
  ];

  return (
    <StudentLayout>
      <h1 className="text-2xl font-bold mb-4">Downloads</h1>
      <ul className="downloads-list">
        {files.map((file, i) => (
          <li key={i}>
            <a href={file.link} download className="text-blue-600 hover:underline">
              {file.name}
            </a>
          </li>
        ))}
      </ul>
    </StudentLayout>
  );
}
