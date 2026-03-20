import React from "react";

export default function Common() {
    return (
        <div className="p-8 max-w-6xl mx-auto animate-fadeIn">
            <h1 className="text-3xl font-bold text-[#1e3a5f] mb-6">Common Service</h1>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col items-center justify-center text-center">
                <div className="text-6xl mb-4 opacity-10">⚙️</div>
                <h2 className="text-xl font-semibold text-gray-600 mb-2">General Services</h2>
                <p className="text-gray-400 max-w-md">Access common campus services like transport, hostel, and more.</p>
            </div>
        </div>
    );
}
