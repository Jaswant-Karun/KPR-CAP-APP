import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getAttendance } from "../../services/studentService";

export default function Attendance() {
    const { user, token } = useAuth();
    const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, percentage: 0, entries: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchAttendance = async () => {
            if (!user?.id || !token) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError("");
                const response = await getAttendance(user.id, token);
                setSummary(response || { total: 0, present: 0, absent: 0, percentage: 0, entries: [] });
            } catch (err) {
                setError(err?.message || "Unable to fetch attendance");
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [user?.id, token]);

    const subjectMap = new Map();
    for (const entry of summary.entries || []) {
        const key = entry.subject || "General";
        if (!subjectMap.has(key)) {
            subjectMap.set(key, { subject: key, total: 0, present: 0, absent: 0, onDuty: 0 });
        }
        const item = subjectMap.get(key);
        item.total += 1;
        if (entry.status === "present") item.present += 1;
        else if (entry.status === "absent") item.absent += 1;
        else item.onDuty += 1;
    }
    const subjectStats = Array.from(subjectMap.values());

    const todayKey = new Date().toISOString().slice(0, 10);
    const todayEntries = (summary.entries || []).filter((entry) => entry.date === todayKey);

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-100 mb-2">Faculty Published Attendance</h1>
            <p className="text-slate-300 mb-6">This is the attendance marked by faculty for your class.</p>

            {loading && <p>Loading attendance...</p>}
            {error && <p className="text-red-600">{error}</p>}

            {!loading && !error && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="p-4 bg-slate-800 rounded-xl border border-slate-600">
                            <p className="text-sm text-slate-300">Total Records</p>
                            <p className="text-2xl font-bold text-slate-100">{summary.total}</p>
                        </div>
                        <div className="p-4 bg-emerald-900/60 rounded-xl border border-emerald-600/60">
                            <p className="text-sm text-emerald-200">Present</p>
                            <p className="text-2xl font-bold text-emerald-300">{summary.present}</p>
                        </div>
                        <div className="p-4 bg-rose-900/60 rounded-xl border border-rose-600/60">
                            <p className="text-sm text-rose-200">Absent</p>
                            <p className="text-2xl font-bold text-rose-300">{summary.absent}</p>
                        </div>
                        <div className="p-4 bg-sky-900/60 rounded-xl border border-sky-600/60">
                            <p className="text-sm text-sky-200">Overall %</p>
                            <p className="text-2xl font-bold text-sky-300">{summary.percentage}%</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto bg-slate-900/85 border border-slate-700 rounded-xl">
                        <table className="min-w-full">
                            <thead className="bg-slate-800/90">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">Date</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">Subject / Period</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(summary.entries || []).length === 0 ? (
                                    <tr>
                                        <td className="px-4 py-6 text-sm text-slate-300" colSpan="3">
                                            No attendance records yet.
                                        </td>
                                    </tr>
                                ) : (
                                    summary.entries.map((entry) => (
                                        <tr key={entry.id} className="border-t border-slate-700/70">
                                            <td className="px-4 py-3 text-sm text-slate-200">{entry.date}</td>
                                            <td className="px-4 py-3 text-sm text-slate-200">{entry.subject || "General"}</td>
                                            <td
                                                className={`px-4 py-3 text-sm font-semibold ${
                                                    entry.status === "present" ? "text-emerald-300" : "text-rose-300"
                                                }`}
                                            >
                                                {entry.status}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 bg-slate-900/85 border border-slate-700 rounded-xl p-4">
                        <h2 className="text-lg font-semibold text-slate-100 mb-3">Course-wise Attendance Content</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {subjectStats.length === 0 ? (
                                <p className="text-sm text-slate-300">No course-wise attendance data yet.</p>
                            ) : (
                                subjectStats.map((item) => {
                                    const percent = item.total > 0 ? ((item.present / item.total) * 100).toFixed(2) : "0.00";
                                    return (
                                        <div key={item.subject} className="border border-slate-600 rounded-lg p-3 bg-slate-800/80">
                                            <p className="font-semibold text-slate-100">{item.subject}</p>
                                            <p className="text-sm text-emerald-300">Overall: {item.total} Hours ({percent}%)</p>
                                            <p className="text-sm text-emerald-200">Present: {item.present} Hours</p>
                                            <p className="text-sm text-amber-300">On-Duty: {item.onDuty} Hours</p>
                                            <p className="text-sm text-rose-300">Absent: {item.absent} Hours</p>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="mt-6 bg-slate-900/85 border border-slate-700 rounded-xl p-4">
                        <h2 className="text-lg font-semibold text-slate-100 mb-3">Day View Content</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {(todayEntries.length === 0 ? [{ subject: "NA", status: "absent", periodNo: "--" }] : todayEntries).map(
                                (entry, idx) => (
                                    <div key={`${entry.id || idx}`} className="border border-slate-600 rounded-lg p-3 bg-slate-800/80">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="font-semibold text-slate-100">{entry.subject || "General"}</p>
                                            <span
                                                className={`text-xs px-2 py-1 rounded font-semibold ${
                                                    entry.status === "present" ? "bg-emerald-900 text-emerald-200" : "bg-rose-900 text-rose-200"
                                                }`}
                                            >
                                                {String(entry.status || "absent").toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-300">Date: {entry.date || todayKey}</p>
                                        <p className="text-sm text-slate-300">Period: {entry.periodNo || "--"}</p>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
