import { useMemo, useState } from "react";
import {
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaAngleLeft,
  FaAngleRight,
  FaClock,
  FaEye,
  FaFilter,
  FaSearch,
  FaSyncAlt,
  FaUsers,
} from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import "./HostelUsersPage.css";

const getInitials = (name) => {
  const value = String(name || "User").trim();
  const parts = value.split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
};

export default function HostelUsersPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    if (!user) return [];
    return [{
      id: user.id || 0,
      rollNo: user.rollNo || user.serial || "-",
      name: user.name || "Student User",
      email: user.email || "-",
      phone: user.phone || user.mobile || "-",
      department: user.department || "-",
      section: user.section || "-",
      active: true,
      lastLogin: user.lastLogin || new Date().toISOString(),
      roleTag: String(user.role || "student").slice(0, 3).toUpperCase(),
    }];
  }, [user]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const query = search.toLowerCase();
    return rows.filter((row) =>
      String(row.rollNo || "").toLowerCase().includes(query) ||
      String(row.name || "").toLowerCase().includes(query) ||
      String(row.email || "").toLowerCase().includes(query)
    );
  }, [rows, search]);

  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = pageStart + pageSize;
  const pagedRows = filteredRows.slice(pageStart, pageEnd);
  const pageFrom = totalItems === 0 ? 0 : pageStart + 1;
  const pageTo = totalItems === 0 ? 0 : Math.min(pageEnd, totalItems);

  return (
    <div className="hu-page">
      <header className="hu-header">
        <div className="hu-title">
          <FaUsers />
          <h1>Users</h1>
        </div>

        <div className="hu-actions">
          <label className="hu-search">
            <FaSearch />
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" />
          </label>
          <button type="button" className="hu-icon-btn" title="Filter">
            <FaFilter />
          </button>
          <button type="button" className="hu-icon-btn" title="Refresh">
            <FaSyncAlt />
          </button>
        </div>
      </header>

      <section className="hu-table-wrap">
        <table className="hu-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Email & Phone</th>
              <th>Dept.</th>
              <th>Section</th>
              <th>Active</th>
              <th>Last Login</th>
              <th>Actions</th>
              <th className="hu-col-check">
                <input type="checkbox" aria-label="Select all rows" />
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr><td colSpan={9} className="hu-empty">No data available</td></tr>
            ) : (
              pagedRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.id || "-"}</strong>
                    <small>{row.rollNo}</small>
                  </td>
                  <td>
                    <div className="hu-user">
                      <div className="hu-avatar">{getInitials(row.name)}</div>
                      <div>
                        <div className="hu-user-top">
                          <span className="hu-roll-badge">{row.rollNo}</span>
                          <span className="hu-role-tag">{row.roleTag}</span>
                        </div>
                        <strong>{row.name}</strong>
                      </div>
                    </div>
                  </td>
                  <td>
                    <small>{row.email}</small>
                    <small>{row.phone}</small>
                  </td>
                  <td>{row.department}</td>
                  <td>
                    <div className="hu-pill-group">
                      <span className="hu-pill">{row.section || "A"}</span>
                    </div>
                  </td>
                  <td><span className="hu-active-pill">{row.active ? "Yes" : "No"}</span></td>
                  <td>{formatDateTime(row.lastLogin)}</td>
                  <td>
                    <div className="hu-action-group">
                      <button type="button" className="hu-icon-btn"><FaEye /></button>
                      <button type="button" className="hu-icon-btn"><FaClock /></button>
                    </div>
                  </td>
                  <td><input type="checkbox" aria-label={`Select user ${row.id}`} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <footer className="hu-pagination">
        <div className="hu-page-size">
          <span>Items per page:</span>
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value) || 10);
              setPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="hu-page-count">{pageFrom}-{pageTo} of {totalItems}</div>

        <div className="hu-page-controls">
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
