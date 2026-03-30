import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { FaSearch, FaCheck, FaTimes, FaComment } from "react-icons/fa";
import "./ServiceRequestsApproval.css";

const REQUEST_TYPES = ["AO Service", "Student Service", "Common Services"];
const STATUSES = ["pending", "approved", "rejected"];

export default function ServiceRequestsApproval() {
  const { user, token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvalRemark, setApprovalRemark] = useState("");

  // Mock data
  const mockRequests = [
    {
      id: 1,
      ticket: "REQ-001",
      student: "Arun Kumar",
      rollNo: "CB001",
      type: "AO Service",
      subject: "Infrastructure Request",
      status: "pending",
      createdAt: new Date().toISOString(),
      description: "Need access to computer lab for project work",
      remark: "",
    },
    {
      id: 2,
      ticket: "REQ-002",
      student: "Priya Singh",
      rollNo: "CB002",
      type: "Student Service",
      subject: "Certificate Request",
      status: "pending",
      createdAt: new Date().toISOString(),
      description: "Bonafide certificate required for bank opening",
      remark: "",
    },
    {
      id: 3,
      ticket: "REQ-003",
      student: "Rajesh Patel",
      rollNo: "CB003",
      type: "Common Services",
      subject: "Hostel Support",
      status: "pending",
      createdAt: new Date().toISOString(),
      description: "Room transfer request",
      remark: "",
    },
  ];

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setRequests(mockRequests);
      setLoading(false);
    }, 300);
  }, [token]);

  const filteredRequests = useMemo(() => {
    let filtered = requests;

    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((r) => r.type === typeFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.ticket.toLowerCase().includes(q) ||
          r.student.toLowerCase().includes(q) ||
          r.rollNo.toLowerCase().includes(q) ||
          r.subject.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [requests, searchTerm, statusFilter, typeFilter]);

  const handleApprove = async (requestId) => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // await approveRequest(requestId, { remark: approvalRemark }, token);
      setRequests(
        requests.map((r) =>
          r.id === requestId
            ? { ...r, status: "approved", remark: approvalRemark }
            : r
        )
      );
      setMessage("✓ Request approved successfully");
      setMessageType("success");
      setSelectedRequest(null);
      setApprovalRemark("");
    } catch (error) {
      setMessage(error?.message || "Failed to approve request");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (requestId) => {
    try {
      setLoading(true);
      if (!approvalRemark.trim()) {
        setMessage("Please provide rejection reason");
        setMessageType("error");
        return;
      }
      // TODO: Replace with actual API call
      // await rejectRequest(requestId, { reason: approvalRemark }, token);
      setRequests(
        requests.map((r) =>
          r.id === requestId
            ? { ...r, status: "rejected", remark: approvalRemark }
            : r
        )
      );
      setMessage("✓ Request rejected");
      setMessageType("success");
      setSelectedRequest(null);
      setApprovalRemark("");
    } catch (error) {
      setMessage(error?.message || "Failed to reject request");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "approved";
      case "rejected":
        return "rejected";
      case "pending":
        return "pending";
      default:
        return "pending";
    }
  };

  return (
    <div className="service-requests-page">
      <div className="page-header">
        <h1>Service Requests Approval</h1>
        <p>Review and approve/reject student service requests</p>
      </div>

      <div className="page-toolbar">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by ticket, student name, or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>

          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            {REQUEST_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="loading-state">Loading requests...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="empty-state">
          <p>No service requests found</p>
        </div>
      ) : (
        <div className="requests-grid">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className={`request-card status-${getStatusColor(req.status)}`}
              onClick={() => setSelectedRequest(req)}
            >
              <div className="card-header">
                <div className="ticket-info">
                  <div className="ticket-no">{req.ticket}</div>
                  <div className="request-type">{req.type}</div>
                </div>
                <div className={`status-badge ${getStatusColor(req.status)}`}>
                  {req.status.toUpperCase()}
                </div>
              </div>

              <div className="card-body">
                <p className="student-name">{req.student}</p>
                <p className="roll-no">{req.rollNo}</p>
                <p className="subject">{req.subject}</p>
                <p className="description">{req.description}</p>
              </div>

              <div className="card-footer">
                <span className="created-at">
                  {new Date(req.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedRequest && (
        <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Request Details</h2>
              <button
                className="btn-close"
                onClick={() => setSelectedRequest(null)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-row">
                <label>Ticket:</label>
                <span>{selectedRequest.ticket}</span>
              </div>
              <div className="detail-row">
                <label>Student:</label>
                <span>{selectedRequest.student} ({selectedRequest.rollNo})</span>
              </div>
              <div className="detail-row">
                <label>Type:</label>
                <span>{selectedRequest.type}</span>
              </div>
              <div className="detail-row">
                <label>Subject:</label>
                <span>{selectedRequest.subject}</span>
              </div>
              <div className="detail-section">
                <label>Description:</label>
                <div className="description-box">{selectedRequest.description}</div>
              </div>

              {selectedRequest.status === "pending" && (
                <>
                  <div className="detail-section">
                    <label>Remark / Reason:</label>
                    <textarea
                      placeholder="Add approval remark or rejection reason..."
                      value={approvalRemark}
                      onChange={(e) => setApprovalRemark(e.target.value)}
                      rows="4"
                    />
                  </div>

                  <div className="modal-actions">
                    <button
                      className="btn btn-approve"
                      onClick={() => handleApprove(selectedRequest.id)}
                      disabled={loading}
                    >
                      <FaCheck /> Approve
                    </button>
                    <button
                      className="btn btn-reject"
                      onClick={() => handleReject(selectedRequest.id)}
                      disabled={loading}
                    >
                      <FaTimes /> Reject
                    </button>
                  </div>
                </>
              )}

              {selectedRequest.status !== "pending" && (
                <div className="approved-remark">
                  <strong>Decision Remark:</strong>
                  <p>{selectedRequest.remark || "No remark provided"}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
