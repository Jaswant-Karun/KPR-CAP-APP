import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { createGatepass, getGatepassRequests } from "../../services/gatepassService";

const today = () => new Date().toISOString().slice(0, 10);

export default function MainGate() {
  const { user, token } = useAuth();
  const [fromDate, setFromDate] = useState(today());
  const [toDate, setToDate] = useState(today());
  const [reason, setReason] = useState("");
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");

  const loadGatepass = async () => {
    try {
      const res = await getGatepassRequests(token);
      setRows(res?.requests || []);
    } catch (err) {
      setMessage(err?.message || "Failed to load gatepass requests");
    }
  };

  useEffect(() => {
    if (token) {
      loadGatepass();
    }
  }, [token]);

  const submitRequest = async () => {
    if (!reason.trim()) {
      setMessage("Reason is required");
      return;
    }

    try {
      await createGatepass(
        {
          fromDate,
          toDate,
          reason,
          studentName: user?.name,
          rollNo: user?.rollNo,
        },
        token
      );
      setReason("");
      setMessage("Gatepass request sent for faculty approval.");
      await loadGatepass();
    } catch (err) {
      setMessage(err?.message || "Failed to create gatepass request");
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fadeIn">
      <h1 className="text-2xl font-bold mb-4">Main Gate Pass</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-5">
        <h2 className="font-semibold mb-3">Create Gatepass Request</h2>
        <div className="grid md:grid-cols-3 gap-3 mb-3">
          <label className="text-sm text-slate-600">
            From Date
            <input className="mt-1 w-full border rounded px-3 py-2" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </label>
          <label className="text-sm text-slate-600">
            To Date
            <input className="mt-1 w-full border rounded px-3 py-2" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </label>
          <label className="text-sm text-slate-600 md:col-span-1">
            Reason
            <input className="mt-1 w-full border rounded px-3 py-2" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Medical / Emergency / Personal" />
          </label>
        </div>
        <button type="button" className="px-4 py-2 rounded bg-blue-600 text-white" onClick={submitRequest}>
          Submit for Approval
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h2 className="font-semibold mb-3">My Gatepass Requests</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-sm text-slate-500 border-b">
                <th className="py-2 pr-4">From</th>
                <th className="py-2 pr-4">To</th>
                <th className="py-2 pr-4">Reason</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-4 text-slate-500">No gatepass requests yet.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{row.fromDate}</td>
                    <td className="py-2 pr-4">{row.toDate}</td>
                    <td className="py-2 pr-4">{row.reason}</td>
                    <td className="py-2 pr-4 font-semibold capitalize">{row.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {message && <p className="mt-3 text-sm text-blue-700">{message}</p>}
    </div>
  );
}
