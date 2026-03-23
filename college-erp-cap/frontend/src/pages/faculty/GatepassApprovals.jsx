import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getGatepassRequests, updateGatepassStatus } from "../../services/gatepassService";

export default function GatepassApprovals() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      const res = await getGatepassRequests(token);
      setRows(res?.requests || []);
    } catch (err) {
      setMessage(err?.message || "Failed to load gatepass approvals");
    }
  };

  useEffect(() => {
    if (token) {
      load();
    }
  }, [token]);

  const updateStatus = async (gatepassId, status) => {
    try {
      await updateGatepassStatus(gatepassId, { status }, token);
      setMessage(`Gatepass ${status} successfully.`);
      await load();
    } catch (err) {
      setMessage(err?.message || "Unable to update gatepass status");
    }
  };

  return (
    <div className="faculty-page-wrap">
      <h1 className="faculty-title">Gatepass Approval</h1>
      <p className="faculty-subtitle">Faculty can approve or reject student gatepass requests.</p>

      <div className="overflow-x-auto bg-[rgba(8,11,20,0.95)] border border-cyan-900 rounded-lg">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-sm text-cyan-200 border-b border-cyan-900">
              <th className="px-3 py-2">Student</th>
              <th className="px-3 py-2">Roll No</th>
              <th className="px-3 py-2">From</th>
              <th className="px-3 py-2">To</th>
              <th className="px-3 py-2">Reason</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-3 py-4 text-slate-300">No gatepass requests found.</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-cyan-950 last:border-0 text-slate-200">
                  <td className="px-3 py-2">{row.studentName || "Student"}</td>
                  <td className="px-3 py-2">{row.rollNo || "--"}</td>
                  <td className="px-3 py-2">{row.fromDate}</td>
                  <td className="px-3 py-2">{row.toDate}</td>
                  <td className="px-3 py-2">{row.reason}</td>
                  <td className="px-3 py-2 capitalize">{row.status}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => updateStatus(row.id, "approved")}
                        disabled={row.status !== "pending"}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="remove-student-btn"
                        onClick={() => updateStatus(row.id, "rejected")}
                        disabled={row.status !== "pending"}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {message && <p className="attendance-message">{message}</p>}
    </div>
  );
}
