import { useEffect, useMemo, useState } from "react";
import {
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaAngleLeft,
  FaAngleRight,
  FaFilter,
  FaSearch,
  FaSyncAlt,
} from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { getHostelAttendanceRequests } from "../../services/bookingService";
import "./HostelAttendancePage.css";

const STATUS_OPTIONS = ["all", "open", "approved", "rejected"];

const statusLabel = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === "open") return "Pending";
  if (!value) return "-";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export default function HostelAttendancePage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const loadRows = async () => {
    setLoading(true);
    try {
      const response = await getHostelAttendanceRequests(token, { status: statusFilter, date: dateFilter });
      setRows(Array.isArray(response?.requests) ? response.requests : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, statusFilter, dateFilter]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const query = search.toLowerCase();
    return rows.filter((item) => {
      const ticket = String(item.id || "").toLowerCase();
      const createdByName = String(item.createdByName || "").toLowerCase();
      const room = String(item.metadata?.room || "").toLowerCase();
      const manualReason = String(item.metadata?.manualReason || item.description || "").toLowerCase();
      return ticket.includes(query) || createdByName.includes(query) || room.includes(query) || manualReason.includes(query);
    });
  }, [rows, search]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, dateFilter, pageSize, rows.length]);

  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = pageStart + pageSize;
  const pagedRows = filteredRows.slice(pageStart, pageEnd);
  const pageFrom = totalItems === 0 ? 0 : pageStart + 1;
  const pageTo = totalItems === 0 ? 0 : Math.min(pageEnd, totalItems);

  return (
    <div className="ha-page">
      <header className="ha-header">
        <h1>Hostel Attendance</h1>

        <div className="ha-toolbar">
          <label>
            <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
          </label>
          <label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {STATUS_OPTIONS.map((value) => (
                <option key={value} value={value}>{value === "all" ? "Status" : statusLabel(value)}</option>
              ))}
            </select>
          </label>
          <label className="ha-search">
            <FaSearch />
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" />
          </label>
          <button type="button" className="ha-icon-btn" title="Filter"><FaFilter /></button>
          <button type="button" className="ha-icon-btn" onClick={loadRows} title="Refresh"><FaSyncAlt /></button>
        </div>
      </header>

      <section className="ha-table-wrap">
        <table className="ha-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Status</th>
              <th>User</th>
              <th>Room</th>
              <th>Date</th>
              <th>Punch Log</th>
              <th>Manual Reason</th>
              <th>Actions</th>
              <th className="ha-col-check">
                <input type="checkbox" aria-label="Select all rows" />
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="ha-empty">Loading...</td></tr>
            ) : filteredRows.length === 0 ? (
              <tr><td colSpan={9} className="ha-empty">No data available</td></tr>
            ) : (
              pagedRows.map((item) => (
                <tr key={item.id}>
                  <td>HAT-{String(item.id).padStart(4, "0")}</td>
                  <td>{statusLabel(item.status)}</td>
                  <td>{item.createdByName || "-"}</td>
                  <td>{item.metadata?.room || "-"}</td>
                  <td>{item.metadata?.date || "-"}</td>
                  <td>{item.metadata?.punchLog || "-"}</td>
                  <td>{item.metadata?.manualReason || item.description || "-"}</td>
                  <td>-</td>
                  <td><input type="checkbox" aria-label={`Select attendance ${item.id}`} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="ha-card-list" aria-live="polite">
        {loading ? (
          <article className="ha-card ha-card-empty">Loading...</article>
        ) : filteredRows.length === 0 ? (
          <article className="ha-card ha-card-empty">No data available</article>
        ) : (
          pagedRows.map((item) => (
            <article key={`card-${item.id}`} className="ha-card">
              <div className="ha-card-top">
                <strong>HAT-{String(item.id).padStart(4, "0")}</strong>
                <span>{statusLabel(item.status)}</span>
              </div>

              <div className="ha-card-body">
                <p>
                  <span>User</span>
                  <strong>{item.createdByName || "-"}</strong>
                </p>
                <p>
                  <span>Room</span>
                  <strong>{item.metadata?.room || "-"}</strong>
                </p>
                <p>
                  <span>Date</span>
                  <strong>{item.metadata?.date || "-"}</strong>
                </p>
                <p>
                  <span>Punch Log</span>
                  <strong>{item.metadata?.punchLog || "-"}</strong>
                </p>
                <p>
                  <span>Manual Reason</span>
                  <strong>{item.metadata?.manualReason || item.description || "-"}</strong>
                </p>
              </div>
            </article>
          ))
        )}
      </section>

      <footer className="ha-pagination">
        <div className="ha-page-size">
          <span>Items per page:</span>
          <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value) || 10)}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="ha-page-count">{pageFrom}-{pageTo} of {totalItems}</div>

        <div className="ha-page-controls">
          <button type="button" onClick={() => setPage(1)} disabled={currentPage <= 1} aria-label="First page">
            <FaAngleDoubleLeft />
          </button>
          <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage <= 1} aria-label="Previous page">
            <FaAngleLeft />
          </button>
          <span>{currentPage}</span>
          <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage >= totalPages} aria-label="Next page">
            <FaAngleRight />
          </button>
          <button type="button" onClick={() => setPage(totalPages)} disabled={currentPage >= totalPages} aria-label="Last page">
            <FaAngleDoubleRight />
          </button>
        </div>
      </footer>
    </div>
  );
}
