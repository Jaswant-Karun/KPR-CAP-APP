import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { FaSearch, FaCheck, FaTimes, FaFile, FaImage } from "react-icons/fa";
import "./StudentUploadsApproval.css";

const UPLOAD_TYPES = ["ID Card", "Certificate", "Document", "Project"];

export default function StudentUploadsApproval() {
  const { user, token } = useAuth();
  const [uploads, setUploads] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [selectedUpload, setSelectedUpload] = useState(null);
  const [approvalRemark, setApprovalRemark] = useState("");

  // Mock data
  const mockUploads = [
    {
      id: 1,
      uploadId: "UPL-001",
      student: "Arun Kumar",
      rollNo: "CB001",
      type: "ID Card",
      filename: "ArunKumar_IDCard.jpg",
      fileUrl: "/uploads/sample.jpg",
      uploadedAt: new Date().toISOString(),
      status: "pending",
      description: "Student ID card for verification",
      remark: "",
    },
    {
      id: 2,
      uploadId: "UPL-002",
      student: "Priya Singh",
      rollNo: "CB002",
      type: "Certificate",
      filename: "PriyaSingh_Certificate.pdf",
      fileUrl: "/uploads/sample.pdf",
      uploadedAt: new Date().toISOString(),
      status: "pending",
      description: "12th standard marksheet certificate",
      remark: "",
    },
    {
      id: 3,
      uploadId: "UPL-003",
      student: "Rajesh Patel",
      rollNo: "CB003",
      type: "Document",
      filename: "RajeshPatel_AdmitCard.pdf",
      fileUrl: "/uploads/sample.pdf",
      uploadedAt: new Date().toISOString(),
      status: "pending",
      description: "Entrance exam admit card",
      remark: "",
    },
  ];

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setUploads(mockUploads);
      setLoading(false);
    }, 300);
  }, [token]);

  const filteredUploads = useMemo(() => {
    let filtered = uploads;

    if (statusFilter !== "all") {
      filtered = filtered.filter((u) => u.status === statusFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((u) => u.type === typeFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.uploadId.toLowerCase().includes(q) ||
          u.student.toLowerCase().includes(q) ||
          u.rollNo.toLowerCase().includes(q) ||
          u.filename.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [uploads, searchTerm, statusFilter, typeFilter]);

  const handleApprove = async (uploadId) => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // await approveUpload(uploadId, { remark: approvalRemark }, token);
      setUploads(
        uploads.map((u) =>
          u.id === uploadId
            ? { ...u, status: "approved", remark: approvalRemark }
            : u
        )
      );
      setMessage("✓ Upload approved successfully");
      setMessageType("success");
      setSelectedUpload(null);
      setApprovalRemark("");
    } catch (error) {
      setMessage(error?.message || "Failed to approve upload");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (uploadId) => {
    try {
      setLoading(true);
      if (!approvalRemark.trim()) {
        setMessage("Please provide rejection reason");
        setMessageType("error");
        return;
      }
      // TODO: Replace with actual API call
      // await rejectUpload(uploadId, { reason: approvalRemark }, token);
      setUploads(
        uploads.map((u) =>
          u.id === uploadId
            ? { ...u, status: "rejected", remark: approvalRemark }
            : u
        )
      );
      setMessage("✓ Upload rejected");
      setMessageType("success");
      setSelectedUpload(null);
      setApprovalRemark("");
    } catch (error) {
      setMessage(error?.message || "Failed to reject upload");
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

  const getFileIcon = (filename) => {
    if (filename.toLowerCase().includes(".pdf")) return FaFile;
    if (filename.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/i)) return FaImage;
    return FaFile;
  };

  return (
    <div className="uploads-approval-page">
      <div className="page-header">
        <h1>Student Uploads Approval</h1>
        <p>Review and approve/reject student document uploads</p>
      </div>

      <div className="page-toolbar">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by upload ID, student name, or filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            {UPLOAD_TYPES.map((type) => (
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
        <div className="loading-state">Loading uploads...</div>
      ) : filteredUploads.length === 0 ? (
        <div className="empty-state">
          <p>No uploads found</p>
        </div>
      ) : (
        <div className="uploads-grid">
          {filteredUploads.map((upload) => {
            const FileIcon = getFileIcon(upload.filename);
            return (
              <div
                key={upload.id}
                className={`upload-card status-${getStatusColor(upload.status)}`}
                onClick={() => setSelectedUpload(upload)}
              >
                <div className="card-header">
                  <div className="file-icon">
                    <FileIcon />
                  </div>
                  <div className="upload-info">
                    <div className="upload-id">{upload.uploadId}</div>
                    <div className="upload-type">{upload.type}</div>
                  </div>
                  <div className={`status-badge ${getStatusColor(upload.status)}`}>
                    {upload.status.toUpperCase()}
                  </div>
                </div>

                <div className="card-body">
                  <p className="student-name">{upload.student}</p>
                  <p className="roll-no">{upload.rollNo}</p>
                  <p className="filename">{upload.filename}</p>
                  <p className="description">{upload.description}</p>
                </div>

                <div className="card-footer">
                  <span className="uploaded-at">
                    {new Date(upload.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedUpload && (
        <div className="modal-overlay" onClick={() => setSelectedUpload(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Review</h2>
              <button
                className="btn-close"
                onClick={() => setSelectedUpload(null)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-row">
                <label>Upload ID:</label>
                <span>{selectedUpload.uploadId}</span>
              </div>
              <div className="detail-row">
                <label>Student:</label>
                <span>{selectedUpload.student} ({selectedUpload.rollNo})</span>
              </div>
              <div className="detail-row">
                <label>Type:</label>
                <span>{selectedUpload.type}</span>
              </div>
              <div className="detail-row">
                <label>Filename:</label>
                <span>{selectedUpload.filename}</span>
              </div>
              <div className="detail-row">
                <label>Uploaded:</label>
                <span>{new Date(selectedUpload.uploadedAt).toLocaleString()}</span>
              </div>

              <div className="detail-section">
                <label>Description:</label>
                <div className="description-box">{selectedUpload.description}</div>
              </div>

              <div className="file-preview">
                <label>File Preview:</label>
                {selectedUpload.filename.toLowerCase().includes(".pdf") ? (
                  <div className="pdf-preview">
                    <FaFile className="pdf-icon" />
                    <p>PDF File</p>
                    <a href={selectedUpload.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-preview">
                      Open PDF
                    </a>
                  </div>
                ) : (
                  <img
                    src={selectedUpload.fileUrl}
                    alt="Upload preview"
                    className="image-preview"
                  />
                )}
              </div>

              {selectedUpload.status === "pending" && (
                <>
                  <div className="detail-section">
                    <label>Review Remark / Reason:</label>
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
                      onClick={() => handleApprove(selectedUpload.id)}
                      disabled={loading}
                    >
                      <FaCheck /> Approve
                    </button>
                    <button
                      className="btn btn-reject"
                      onClick={() => handleReject(selectedUpload.id)}
                      disabled={loading}
                    >
                      <FaTimes /> Reject
                    </button>
                  </div>
                </>
              )}

              {selectedUpload.status !== "pending" && (
                <div className="approved-remark">
                  <strong>Review Remark:</strong>
                  <p>{selectedUpload.remark || "No remark provided"}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
