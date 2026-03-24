import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPlus, FaSearch, FaTimes } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";

const STORAGE_KEY = "student_projects";

const buildTicket = (index) => `PRJ-${String(index).padStart(4, "0")}`;

export default function Project() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const isFacultyStudentView = location.pathname.startsWith("/faculty/");
    const dashboardPath = isFacultyStudentView ? "/faculty/student/dashboard" : "/student/dashboard";

    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [projects, setProjects] = useState([]);
    const [form, setForm] = useState({
        student: user?.name || user?.email || "",
        project: "",
    });

    useEffect(() => {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        setProjects(Array.isArray(parsed) ? parsed : []);
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }, [projects]);

    const filteredProjects = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return projects;

        return projects.filter(
            (row) =>
                String(row.ticket).toLowerCase().includes(query) ||
                String(row.student).toLowerCase().includes(query) ||
                String(row.project).toLowerCase().includes(query)
        );
    }, [projects, search]);

    const handleAddProject = (event) => {
        event.preventDefault();

        const projectName = form.project.trim();
        const studentName = form.student.trim() || user?.name || user?.email || "Student";
        if (!projectName) {
            alert("Please enter project title");
            return;
        }

        const nextTicket = buildTicket(projects.length + 1);
        const newProject = {
            id: Date.now(),
            ticket: nextTicket,
            student: studentName,
            project: projectName,
            createdAt: new Date().toISOString(),
        };

        setProjects((prev) => [newProject, ...prev]);
        setForm({
            student: user?.name || user?.email || "",
            project: "",
        });
        setShowModal(false);
    };

    return (
        <div className="main-gate-page p-6 md:p-8 max-w-7xl mx-auto animate-fadeIn">
            <button type="button" className="feature-back-btn" onClick={() => navigate(dashboardPath)}>
                <FaArrowLeft /> Back
            </button>

            <div className="main-gate-card rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-700 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <h1 className="text-xl md:text-2xl font-bold text-slate-100">4.0 Final Year Project - I</h1>

                    <div className="flex items-center gap-2">
                        <div className="relative w-[220px] md:w-[320px]">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search"
                                className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-600 bg-slate-900 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowModal(true)}
                            className="h-10 px-4 rounded-lg border border-cyan-500/30 bg-slate-900 text-cyan-200 text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
                        >
                            <FaPlus /> Add Project
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[430px]">
                    <table className="w-full min-w-[760px]">
                        <thead>
                            <tr className="border-b border-slate-700 text-left text-sm text-slate-200 bg-slate-900/60">
                                <th className="py-3 px-5 font-semibold">Ticket</th>
                                <th className="py-3 px-5 font-semibold">Student</th>
                                <th className="py-3 px-5 font-semibold">Project</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProjects.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="text-center text-slate-400 py-16 text-sm">
                                        No data available
                                    </td>
                                </tr>
                            ) : (
                                filteredProjects.map((row) => (
                                    <tr key={row.id} className="border-b border-slate-800 hover:bg-slate-900/40 text-sm text-slate-300">
                                        <td className="py-3 px-5 font-medium">{row.ticket}</td>
                                        <td className="py-3 px-5">{row.student}</td>
                                        <td className="py-3 px-5">{row.project}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal ? (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="w-full max-w-lg bg-slate-950 rounded-xl border border-slate-700 shadow-xl">
                        <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-100">Add Final Year Project</h2>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-400"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={handleAddProject} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Student</label>
                                <input
                                    type="text"
                                    value={form.student}
                                    onChange={(event) => setForm((prev) => ({ ...prev, student: event.target.value }))}
                                    className="w-full h-10 px-3 rounded-lg border border-slate-600 bg-slate-900 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                                    placeholder="Student name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Project Title</label>
                                <textarea
                                    rows={4}
                                    value={form.project}
                                    onChange={(event) => setForm((prev) => ({ ...prev, project: event.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-900 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                                    placeholder="Enter project topic"
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="h-10 px-4 rounded-lg border border-slate-600 text-sm text-slate-200 hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="h-10 px-4 rounded-lg border border-cyan-500/30 bg-slate-900 text-cyan-200 text-sm font-medium hover:bg-slate-800"
                                >
                                    Save Project
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
