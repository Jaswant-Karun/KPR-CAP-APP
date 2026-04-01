import { useEffect, useMemo, useState } from "react";
import { FaEye, FaSearch, FaSyncAlt, FaTrash, FaPlus } from "react-icons/fa";
import { useAuth } from "../hooks/useAuth";
import {
  getDigitalAssets,
  createDigitalAsset,
  deleteDigitalAsset,
} from "../services/digitalAssetsService";
import "./DigitalAssets.css";

const statusClass = (status) =>
  String(status || "").toLowerCase() === "active" ? "badge active" : "badge inactive";

export default function DigitalAssets() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";

  const [rows, setRows] = useState([]);
  const [groupFilter, setGroupFilter] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    group: "Others",
    type: "file",
    name: "",
    url: "",
    status: "active",
    order: 0,
  });

  const load = async () => {
    try {
      setLoading(true);
      const res = await getDigitalAssets(token, {
        group: groupFilter || undefined,
        search: search || undefined,
      });
      setRows(res?.assets || []);
      setMessage("");
    } catch (err) {
      setMessage(err?.message || "Failed to load digital assets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      load();
    }
  }, [token, groupFilter]);

  const groups = useMemo(() => {
    const values = new Set(rows.map((item) => String(item.group || "Others")));
    return ["", ...Array.from(values)];
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (item) =>
        String(item.name || "").toLowerCase().includes(q) ||
        String(item.group || "").toLowerCase().includes(q) ||
        String(item.type || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  const onCreate = async (e) => {
    e.preventDefault();
    try {
      await createDigitalAsset(
        {
          group: form.group,
          type: form.type,
          name: form.name,
          url: form.url,
          status: form.status,
          order: Number(form.order || 0),
        },
        token
      );
      setForm({ group: "Others", type: "file", name: "", url: "", status: "active", order: 0 });
      setMessage("Digital asset created successfully.");
      await load();
    } catch (err) {
      setMessage(err?.message || "Failed to create digital asset");
    }
  };

  const onDelete = async (id) => {
    try {
      await deleteDigitalAsset(id, token);
      setMessage("Digital asset deleted successfully.");
      await load();
    } catch (err) {
      setMessage(err?.message || "Failed to delete digital asset");
    }
  };

  return (
    <div className="digital-assets-page">
      <header className="digital-assets-header">
        <h1>Digital Assets</h1>
        <p>Students can view assets. Only admin can create and delete assets.</p>
      </header>

      <section className="digital-assets-toolbar">
        <div className="toolbar-field">
          <label>Group</label>
          <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
            {groups.map((group) => (
              <option key={group || "all"} value={group}>
                {group || "All"}
              </option>
            ))}
          </select>
        </div>

        <div className="toolbar-search">
          <FaSearch />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, group, type"
          />
        </div>

        <button type="button" className="toolbar-refresh" onClick={load}>
          <FaSyncAlt /> Refresh
        </button>
      </section>

      {isAdmin && (
        <section className="digital-assets-create">
          <h2>Create Asset</h2>
          <form onSubmit={onCreate} className="create-grid">
            <input
              value={form.group}
              onChange={(e) => setForm((prev) => ({ ...prev, group: e.target.value }))}
              placeholder="Group (NSC/Others)"
              required
            />
            <select value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}>
              <option value="file">File</option>
              <option value="link">Link</option>
            </select>
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Asset Name"
              required
            />
            <input
              value={form.url}
              onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
              placeholder="Asset URL"
              required
            />
            <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <input
              type="number"
              min="0"
              value={form.order}
              onChange={(e) => setForm((prev) => ({ ...prev, order: e.target.value }))}
              placeholder="Order"
            />
            <button type="submit" className="create-btn">
              <FaPlus /> Create
            </button>
          </form>
        </section>
      )}

      <section className="digital-assets-table-wrap">
        <table className="digital-assets-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Status</th>
              <th>Group</th>
              <th>Type</th>
              <th>Name</th>
              <th>Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="empty-row">Loading assets...</td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-row">No digital assets found.</td>
              </tr>
            ) : (
              filteredRows.map((item) => (
                <tr key={item.id}>
                  <td>{item.ticketNo || item.id}</td>
                  <td>
                    <span className={statusClass(item.status)}>{item.status}</span>
                  </td>
                  <td>
                    <span className="group-chip">{item.group}</span>
                  </td>
                  <td>
                    <span className={`type-chip ${String(item.type).toLowerCase()}`}>{item.type}</span>
                  </td>
                  <td>{item.name}</td>
                  <td>{item.order ?? 0}</td>
                  <td>
                    <div className="actions">
                      <a className="icon-btn" href={item.url} target="_blank" rel="noreferrer" title="Open asset">
                        <FaEye />
                      </a>
                      {isAdmin && (
                        <button
                          type="button"
                          className="icon-btn danger"
                          onClick={() => onDelete(item.id)}
                          title="Delete asset"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {message && <p className="digital-assets-message">{message}</p>}
    </div>
  );
}
