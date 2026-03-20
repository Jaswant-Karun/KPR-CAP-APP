import React from "react";

export default function Attendance() {
    return (
        <div className="p-8 max-w-6xl mx-auto animate-fadeIn">
            <h1 className="text-3xl font-bold text-[#1e3a5f] mb-6">360 Student Attendance View</h1>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col items-center justify-center text-center">
                <div className="text-6xl mb-4 opacity-10">📊</div>
                <h2 className="text-xl font-semibold text-gray-600 mb-2">Attendance Overview</h2>
                <p className="text-gray-400 max-w-md">Check your daily, weekly, and monthly attendance records.</p>
                <div className="mt-8 grid grid-cols-3 gap-6 w-full max-w-2xl">
                    <div className="p-4 bg-green-50 rounded-xl">
                        <p className="text-sm text-gray-500">Present</p>
                        <p className="text-2xl font-bold text-green-600">85%</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-xl">
                        <p className="text-sm text-gray-500">Absent</p>
                        <p className="text-2xl font-bold text-red-600">5%</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-xl">
                        <p className="text-sm text-gray-500">On Duty</p>
                        <p className="text-2xl font-bold text-blue-600">10%</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
