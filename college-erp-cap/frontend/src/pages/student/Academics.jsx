import React from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import "../../pages/student/Dashboard.css"; // Reuse dashboard styles

export default function Academics() {
    const navigate = useNavigate();
    return (
        <div className="p-8 max-w-6xl mx-auto animate-fadeIn">
            <button type="button" className="feature-back-btn" onClick={() => navigate("/student/dashboard")}>
                <FaArrowLeft /> Back
            </button>
            <h1 className="text-3xl font-bold text-[#1e3a5f] mb-6">Academics</h1>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col items-center justify-center text-center">
                <div className="text-6xl mb-4 opacity-10">🎓</div>
                <h2 className="text-xl font-semibold text-gray-600 mb-2">Academics Module</h2>
                <p className="text-gray-400 max-w-md">Access your course details, curriculum, and academic resources here.</p>
                <button className="mt-6 px-6 py-2 bg-blue-50 text-blue-600 rounded-full font-medium hover:bg-blue-100 transition-colors">
                    View Courses
                </button>
            </div>
        </div>
    );
}
