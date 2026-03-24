import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { AuthContext } from "../../context/AuthContext";
import { getFullProfile } from "../../services/studentService";
import "./Profile.css";

export default function Profile() {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = await getFullProfile(token);
        setProfile(data);
        setError("");
      } catch (err) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [token]);

  if (loading) {
    return <div className="profile-page-state">Loading profile...</div>;
  }

  if (error) {
    return <div className="profile-page-state profile-error">{error}</div>;
  }

  if (!profile) {
    return <div className="profile-page-state">No profile data available</div>;
  }

  const infoRows = (obj) =>
    Object.entries(obj).map(([key, value]) => (
      <div className="profile-row" key={key}>
        <span>{key.replace(/([A-Z])/g, " $1").trim()}</span>
        <strong>{Array.isArray(value) ? value.join(", ") : String(value)}</strong>
      </div>
    ));

  return (
    <div className="profile-cyber-page">
      <section className="profile-summary profile-panel">
        <div className="profile-summary-header">
          <h3>Profile</h3>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" className="feature-back-btn" onClick={() => navigate("/student/dashboard")}>
              <FaArrowLeft /> Back
            </button>
            <button type="button" className="profile-home-btn" onClick={() => navigate("/student/dashboard")}>
              Home
            </button>
          </div>
        </div>
        <h2>{profile.profile.name}</h2>
        <p>{profile.profile.email}</p>
        <div className="profile-badges">
          <span>{profile.profile.status.role}</span>
          <span>{profile.profile.status.activity}</span>
          <span>{profile.profile.status.userType}</span>
        </div>
      </section>

      <section className="profile-panel">
        <h3>Personal Details</h3>
        {infoRows(profile.personalDetails)}
      </section>

      <section className="profile-panel">
        <h3>Contact Details</h3>
        {infoRows(profile.contactDetails)}
      </section>

      <section className="profile-panel">
        <h3>Academic Details</h3>
        {infoRows(profile.academicDetails)}
      </section>

      <section className="profile-panel">
        <h3>Admission Details</h3>
        {infoRows(profile.admissionDetails)}
      </section>

      <section className="profile-panel profile-full">
        <h3>Mentor Details</h3>
        <div className="mentor-grid">
          <div>
            <h4>Mentor</h4>
            {infoRows(profile.mentorDetails.mentor)}
          </div>
          <div>
            <h4>Chief Mentor</h4>
            {infoRows(profile.mentorDetails.chiefMentor)}
          </div>
          <div>
            <h4>Section Head</h4>
            {infoRows(profile.mentorDetails.sectionHead)}
          </div>
        </div>
      </section>

      <section className="profile-panel">
        <h3>System Details</h3>
        {infoRows(profile.systemDetails)}
      </section>

      <section className="profile-panel">
        <h3>Permissions</h3>
        {infoRows(profile.permissions)}
      </section>
    </div>
  );
}
