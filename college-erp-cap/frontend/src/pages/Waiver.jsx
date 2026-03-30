import { useEffect, useMemo, useState } from "react";
import {
  FiChevronDown,
  FiFilter,
  FiRefreshCw,
  FiSearch,
  FiSliders,
  FiX,
} from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { getWaiverRequests, updateWaiverRequestStatus } from "../services/waiverService";
import "./Waiver.css";

const defaultFilters = {
  acy: "all",
  sem: "all",
  type: "all",
  department: "all",
  batch: "all",
  section: "all",
  active: "all",
};

const statusClassMap = {
  approved: "is-approved",
  "in-review": "is-review",
  pending: "is-pending",
  rejected: "is-rejected",
};

function toStatusLabel(status) {
  if (status === "in-review") return "In Review";
  if (!status) return "--";
  return String(status).charAt(0).toUpperCase() + String(status).slice(1);
}

export default function Waiver() {
  const { token, user } = useAuth();
  const canApprove = user?.role === "faculty" || user?.role === "admin";
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [filterOptions, setFilterOptions] = useState({
    acy: [],
    sem: [],
    type: [],
    department: [],
    batch: [],
    section: [],
  });

  const fetchWaivers = async (filtersToUse = appliedFilters, searchTerm = search) => {
    if (!token) return;

    try {
      setLoading(true);
      setMessage("");

      const response = await getWaiverRequests(token, {
        ...filtersToUse,
        search: searchTerm,
      });

      setRows(response?.waivers || []);
      setFilterOptions((prev) => ({
        ...prev,
        ...(response?.options || {}),
      }));
    } catch (error) {
      setRows([]);
      setMessage(error?.message || "Failed to load waiver records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaivers(defaultFilters, "");
  }, [token]);

  const filteredRows = useMemo(() => {
    return rows;
  }, [rows]);

  const applyFilters = async () => {
    setAppliedFilters(draftFilters);
    setShowFilters(false);
    await fetchWaivers(draftFilters, search);
  };

  const clearFilters = async () => {
    setDraftFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setSearch("");
    await fetchWaivers(defaultFilters, "");
  };

  const refreshView = async () => {
    setShowFilters(false);
    await clearFilters();
  };

  const updateWaiverStatus = async (waiverId, status) => {
    try {
      if (!token) return;

      const response = await updateWaiverRequestStatus(waiverId, { status }, token);
      const updated = response?.waiver;

      if (updated?.id) {
        setRows((prev) =>
          prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
        );
      }

      setMessage(`Waiver ${updated?.ticket || waiverId} marked as ${toStatusLabel(status)}.`);
    } catch (error) {
      setMessage(error?.message || "Failed to update waiver status");
    }
  };

  const handleSearchKeyDown = async (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    await fetchWaivers(appliedFilters, search);
  };

  return (
    <div className="waiver-page">
      <header className="waiver-header">
        <div>
          <h1>Waivers</h1>
          <p>Track and review waiver tickets in a unified dark workspace.</p>
        </div>

        <div className="waiver-header-actions">
          <button
            type="button"
            className={`waiver-icon-btn ${showFilters ? "is-active" : ""}`}
            onClick={() => setShowFilters((prev) => !prev)}
            aria-label="Toggle filters"
          >
            <FiFilter />
          </button>
          <button type="button" className="waiver-icon-btn" onClick={refreshView} aria-label="Refresh data">
            <FiRefreshCw />
          </button>
        </div>
      </header>

      <div className="waiver-toolbar">
        <label className="waiver-search" htmlFor="waiver-search-input">
          <FiSearch />
          <input
            id="waiver-search-input"
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search by ticket, student, serial, courses"
          />
        </label>

        <button type="button" className="waiver-apply-btn" onClick={() => fetchWaivers(appliedFilters, search)}>
          <FiSearch /> Search
        </button>

        <button type="button" className="waiver-apply-btn" onClick={applyFilters}>
          <FiSliders /> Apply Filter
        </button>
      </div>

      {showFilters && (
        <section className="waiver-filter-panel">
          <div className="waiver-filter-grid">
            <FilterSelect
              label="ACY"
              value={draftFilters.acy}
              onChange={(value) => setDraftFilters((prev) => ({ ...prev, acy: value }))}
              options={filterOptions.acy}
            />
            <FilterSelect
              label="ACY Semester"
              value={draftFilters.sem}
              onChange={(value) => setDraftFilters((prev) => ({ ...prev, sem: value }))}
              options={filterOptions.sem}
            />
            <FilterSelect
              label="Types"
              value={draftFilters.type}
              onChange={(value) => setDraftFilters((prev) => ({ ...prev, type: value }))}
              options={filterOptions.type}
            />
            <FilterSelect
              label="Departments"
              value={draftFilters.department}
              onChange={(value) => setDraftFilters((prev) => ({ ...prev, department: value }))}
              options={filterOptions.department}
            />
            <FilterSelect
              label="Batches"
              value={draftFilters.batch}
              onChange={(value) => setDraftFilters((prev) => ({ ...prev, batch: value }))}
              options={filterOptions.batch}
            />
            <FilterSelect
              label="Sections"
              value={draftFilters.section}
              onChange={(value) => setDraftFilters((prev) => ({ ...prev, section: value }))}
              options={filterOptions.section}
            />
          </div>

          <div className="waiver-filter-footer">
            <label className="waiver-active-toggle">
              <input
                type="checkbox"
                checked={draftFilters.active === "true"}
                onChange={(event) =>
                  setDraftFilters((prev) => ({ ...prev, active: event.target.checked ? "true" : "all" }))
                }
              />
              <span>Active (All)</span>
            </label>

            <button type="button" className="waiver-clear-btn" onClick={clearFilters}>
              <FiX /> Clear
            </button>
          </div>
        </section>
      )}

      <section className="waiver-table-shell">
        <table className="waiver-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Status</th>
              <th>Student</th>
              <th>Sl.</th>
              <th>ACY</th>
              <th>Sem</th>
              <th>Type</th>
              <th>Courses</th>
              <th>Grade</th>
              <th>Point</th>
              <th>Credit</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="12" className="waiver-empty">Loading waiver records...</td>
              </tr>
            ) : filteredRows.length > 0 ? (
              filteredRows.map((row) => (
                <tr key={row.ticket}>
                  <td>{row.ticket}</td>
                  <td>
                    <span className={`waiver-status ${statusClassMap[row.status] || "is-review"}`}>
                      {toStatusLabel(row.status)}
                    </span>
                  </td>
                  <td>{row.student}</td>
                  <td>{row.serial}</td>
                  <td>{row.acy}</td>
                  <td>{row.sem}</td>
                  <td>{row.type}</td>
                  <td>{row.courses}</td>
                  <td>{row.grade}</td>
                  <td>{row.point}</td>
                  <td>{row.credit}</td>
                  <td>
                    {canApprove ? (
                      <div className="waiver-action-stack">
                        <button type="button" className="waiver-row-action">View</button>
                        <button
                          type="button"
                          className="waiver-row-action"
                          onClick={() => updateWaiverStatus(row.id, "approved")}
                          disabled={row.status === "approved"}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="waiver-row-action"
                          onClick={() => updateWaiverStatus(row.id, "rejected")}
                          disabled={row.status === "rejected"}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <button type="button" className="waiver-row-action">View</button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="12" className="waiver-empty">No data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {message ? <p className="waiver-message">{message}</p> : null}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="waiver-filter-item">
      <span>{label}</span>
      <div className="waiver-filter-select-wrap">
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="all">All</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <FiChevronDown />
      </div>
    </label>
  );
}
