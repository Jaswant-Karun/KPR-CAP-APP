import { useMemo, useState } from "react";
import { FiClock, FiFilter, FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import "./Latecomers.css";

const seedRows = [
  {
    id: 1,
    ticket: "LT-24001",
    code: "LC001",
    name: "A. Nivetha",
    email: "24cb001@kpriet.ac.in",
    phone: "9876543201",
    department: "CSE",
    dateTime: "2026-03-31T08:58:00",
    occ: "Traffic Delay",
    status: "pending",
  },
  {
    id: 2,
    ticket: "LT-24002",
    code: "LC002",
    name: "R. Karthik",
    email: "24cb002@kpriet.ac.in",
    phone: "9876543202",
    department: "CSE",
    dateTime: "2026-03-31T09:12:00",
    occ: "Medical Checkup",
    status: "approved",
  },
];

const toDisplay = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

export default function Latecomers() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const rows = useMemo(() => {
    const text = query.trim().toLowerCase();
    return seedRows.filter((item) => {
      const statusOk = statusFilter === "all" ? true : item.status === statusFilter;
      const textOk =
        !text ||
        item.ticket.toLowerCase().includes(text) ||
        item.code.toLowerCase().includes(text) ||
        item.name.toLowerCase().includes(text) ||
        item.department.toLowerCase().includes(text) ||
        item.occ.toLowerCase().includes(text);
      return statusOk && textOk;
    });
  }, [query, statusFilter]);

  return (
    <div className="latecomers-page">
      <button type="button" className="feature-back-btn" onClick={() => navigate("/student/dashboard")}>
        <FaArrowLeft /> Back
      </button>

      <div className="latecomers-header">
        <div>
          <h1>Latecomers</h1>
          <p>Track late entry records and current approval state.</p>
        </div>
        <div className="latecomers-meta">
          <FiClock /> {rows.length} Records
        </div>
      </div>

      <section className="latecomers-toolbar">
        <div className="latecomers-search">
          <FiSearch />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by ticket, code, name, department"
          />
        </div>

        <label>
          <FiFilter />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
      </section>

      <section className="latecomers-table-wrap">
        <table className="latecomers-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Code</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Department</th>
              <th>Date Time</th>
              <th>OCC</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">No data available</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.ticket}</td>
                  <td>{row.code}</td>
                  <td>{row.name}</td>
                  <td>{row.email}</td>
                  <td>{row.phone}</td>
                  <td>{row.department}</td>
                  <td>{toDisplay(row.dateTime)}</td>
                  <td>{row.occ}</td>
                  <td>
                    <span className={`latecomers-status ${row.status}`}>{row.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
