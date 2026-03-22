import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getAdminDashboard } from "../../services/adminService";
import "./AdminPages.css";

export default function Dashboard() {
    const { token } = useAuth();
    const [summary, setSummary] = useState({
        totalUsers: 0,
        totalStudents: 0,
        totalFaculty: 0,
    });
    const [departmentWise, setDepartmentWise] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getAdminDashboard(token);
                setSummary(data?.summary || {});
                setDepartmentWise(data?.departmentWise || []);
            } catch (err) {
                setError(err?.message || "Failed to load admin dashboard");
            }
        };

        if (token) {
            load();
        }
    }, [token]);

    return (
        <div className="admin-page">
            <h1 className="admin-page-title">Admin Dashboard</h1>
            <p className="admin-page-subtitle">Institution-wide visibility and authority controls.</p>

            {error && <p className="admin-message">{error}</p>}

            <section className="admin-grid">
                <article className="admin-stat-card">
                    <p className="admin-stat-label">Total Users</p>
                    <p className="admin-stat-value">{summary.totalUsers || 0}</p>
                </article>
                <article className="admin-stat-card">
                    <p className="admin-stat-label">Total Students</p>
                    <p className="admin-stat-value">{summary.totalStudents || 0}</p>
                </article>
                <article className="admin-stat-card">
                    <p className="admin-stat-label">Total Faculty</p>
                    <p className="admin-stat-value">{summary.totalFaculty || 0}</p>
                </article>
            </section>

            <section className="admin-panel">
                <h2 className="admin-page-title" style={{ fontSize: "1.2rem" }}>Department Breakdown</h2>
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Department</th>
                                <th>Role</th>
                                <th>Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departmentWise.length === 0 ? (
                                <tr>
                                    <td colSpan="3">No department records available.</td>
                                </tr>
                            ) : (
                                departmentWise.map((item, idx) => (
                                    <tr key={`${item.department}-${item.role}-${idx}`}>
                                        <td>{item.department || "N/A"}</td>
                                        <td><span className="admin-badge">{item.role}</span></td>
                                        <td>{item.count}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
