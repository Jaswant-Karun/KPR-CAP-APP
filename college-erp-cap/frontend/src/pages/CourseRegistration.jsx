import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { FiSearch, FiFilter, FiLayout, FiList, FiChevronDown, FiX, FiBook, FiBriefcase, FiUsers, FiAward } from 'react-icons/fi';
import { FACULTY_CLASS_STUDENTS } from '../utils/facultyClassStudents';
import './CourseRegistration.css';

const COURSE_REG_MEMBERS = (() => {
  const mapped = FACULTY_CLASS_STUDENTS.map((student) => ({
    id: `mem-${String(student.studentId).padStart(3, '0')}`,
    rollNo: String(student.rollNo || '').toUpperCase(),
    name: String(student.name || '').trim(),
  }));

  const fixed76thMember = {
    id: 'mem-076',
    rollNo: '24CB076',
    name: 'JAS',
  };

  if (mapped.length >= 76) {
    return mapped.slice(0, 76);
  }

  return [...mapped, fixed76thMember];
})();

const CourseRegistration = () => {
  const { user } = useAuth();
  const userRole = user?.role;
  const isStudent = userRole === 'student';
  const isFaculty = userRole === 'faculty' || userRole === 'admin';

  // Mock course data - replace with API calls
  const [courses, setCourses] = useState([
    {
      id: 1,
      code: 'U21AD401',
      name: 'Machine Learning Essentials',
      credits: 3,
      semester: 4,
      category: 'PCC',
      faculty: 'Dr. Ramakrishnan',
      enrolled: 76,
      capacity: 76,
      prerequisites: ['U21AD301'],
      status: 'full',
      description: 'Comprehensive introduction to machine learning algorithms and applications.',
      members: COURSE_REG_MEMBERS,
    },
    {
      id: 2,
      code: 'U21AD405',
      name: 'Machine Learning Laboratory',
      credits: 1,
      semester: 4,
      category: 'PCC',
      faculty: 'Dr. Ramakrishnan',
      enrolled: 42,
      capacity: 60,
      prerequisites: ['U21AD401'],
      status: 'open',
      description: 'Hands-on laboratory for machine learning implementation.'
    },
    {
      id: 3,
      code: 'U21CB403',
      name: 'Design Studio II',
      credits: 1,
      semester: 4,
      category: 'EEC',
      faculty: 'Dr. Tanisha',
      enrolled: 58,
      capacity: 60,
      prerequisites: [],
      status: 'full',
      description: 'Advanced design thinking and prototyping workshop.'
    },
    {
      id: 4,
      code: 'U21ECX01',
      name: 'Consumer Electronics',
      credits: 2,
      semester: 4,
      category: 'OEC',
      faculty: 'Dr. Brindha',
      enrolled: 38,
      capacity: 50,
      prerequisites: [],
      status: 'open',
      description: 'Study of consumer electronics devices and systems.'
    },
    {
      id: 5,
      code: 'U21MA409',
      name: 'Statistical Methods',
      credits: 3,
      semester: 4,
      category: 'BSC',
      faculty: 'Dr. Suryakumar',
      enrolled: 55,
      capacity: 70,
      prerequisites: [],
      status: 'open',
      description: 'Statistical analysis and hypothesis testing techniques.'
    },
    {
      id: 6,
      code: 'U21MCB14',
      name: 'MooC courses',
      credits: 2,
      semester: 4,
      category: 'MOOC',
      faculty: 'Online Faculty',
      enrolled: 75,
      capacity: 100,
      prerequisites: [],
      status: 'open',
      description: 'Massive Open Online Courses for skill enhancement.'
    },
  ]);

  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    semester: '',
    category: '',
    status: ''
  });
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState('');

  // Get unique filter values
  const semesters = [...new Set(courses.map(c => c.semester))];
  const categories = [...new Set(courses.map(c => c.category))];
  const statuses = ['open', 'full', 'closed'];

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.faculty.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSemester = !selectedFilters.semester || course.semester === parseInt(selectedFilters.semester);
    const matchesCategory = !selectedFilters.category || course.category === selectedFilters.category;
    const matchesStatus = !selectedFilters.status || course.status === selectedFilters.status;

    return matchesSearch && matchesSemester && matchesCategory && matchesStatus;
  });

  // Handle registration/deregistration
  const handleRegister = (courseId) => {
    if (myRegistrations.includes(courseId)) {
      setMyRegistrations(myRegistrations.filter(id => id !== courseId));
      setRegistrationMessage(`Course deregistered successfully!`);
    } else {
      setMyRegistrations([...myRegistrations, courseId]);
      setRegistrationMessage(`Course registered successfully!`);
    }
    setTimeout(() => setRegistrationMessage(''), 3000);
  };

  // Open course details modal
  const openCourseModal = (course) => {
    setSelectedCourse(course);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCourse(null);
  };

  // Calculate seat availability
  const getAvailableSeats = (course) => course.capacity - course.enrolled;
  const getOccupancyPercentage = (course) => Math.round((course.enrolled / course.capacity) * 100);

  return (
    <div className="course-registration-container">
      {/* Header */}
      <div className="course-reg-header">
        <div className="course-reg-header-content">
          <h1 className="course-reg-title">Course Registration</h1>
          <p className="course-reg-subtitle">
            {isStudent ? 'Register for your courses this semester' : 'Manage course registrations and enrollments'}
          </p>
        </div>
        <div className="course-reg-stats">
          <div className="stat-box">
            <span className="stat-label">Available Courses</span>
            <span className="stat-value">{filteredCourses.length}</span>
          </div>
          {isStudent && (
            <div className="stat-box">
              <span className="stat-label">My Registrations</span>
              <span className="stat-value">{myRegistrations.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="course-reg-controls">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by course code, name, or faculty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-section">
          <FiFilter className="filter-icon" />
          
          <select
            value={selectedFilters.semester}
            onChange={(e) => setSelectedFilters({ ...selectedFilters, semester: e.target.value })}
            className="filter-select"
          >
            <option value="">All Semesters</option>
            {semesters.sort((a, b) => a - b).map(sem => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>

          <select
            value={selectedFilters.category}
            onChange={(e) => setSelectedFilters({ ...selectedFilters, category: e.target.value })}
            className="filter-select"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={selectedFilters.status}
            onChange={(e) => setSelectedFilters({ ...selectedFilters, status: e.target.value })}
            className="filter-select"
          >
            <option value="">All Status</option>
            {statuses.map(stat => (
              <option key={stat} value={stat}>
                {stat.charAt(0).toUpperCase() + stat.slice(1)}
              </option>
            ))}
          </select>

          {(selectedFilters.semester || selectedFilters.category || selectedFilters.status) && (
            <button
              onClick={() => setSelectedFilters({ semester: '', category: '', status: '' })}
              className="clear-filters-btn"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="view-toggle">
          <button
            onClick={() => setViewMode('table')}
            className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
            title="Table View"
          >
            <FiList />
          </button>
          <button
            onClick={() => setViewMode('card')}
            className={`toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
            title="Card View"
          >
            <FiLayout />
          </button>
        </div>
      </div>

      {/* Success Message */}
      {registrationMessage && (
        <div className="message-banner success-message">
          {registrationMessage}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="courses-table-wrapper">
          <table className="courses-table">
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Name</th>
                <th>Credits</th>
                <th>Faculty</th>
                <th>Category</th>
                <th>Enrollment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map(course => (
                <tr key={course.id}>
                  <td>
                    <span className="course-code">{course.code}</span>
                  </td>
                  <td>{course.name}</td>
                  <td>{course.credits}</td>
                  <td>{course.faculty}</td>
                  <td>
                    <span className={`badge badge-${course.category.toLowerCase()}`}>
                      {course.category}
                    </span>
                  </td>
                  <td>
                    <div className="enrollment-info">
                      <span>{course.enrolled}/{course.capacity}</span>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${getOccupancyPercentage(course)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge status-${course.status}`}>
                      {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => openCourseModal(course)}
                        className="btn-action btn-details"
                        title="View Details"
                      >
                        Details
                      </button>
                      {isStudent && (
                        <button
                          onClick={() => handleRegister(course.id)}
                          className={`btn-action ${myRegistrations.includes(course.id) ? 'btn-danger' : 'btn-success'}`}
                          disabled={course.status === 'full' && !myRegistrations.includes(course.id)}
                          title={myRegistrations.includes(course.id) ? 'Deregister' : 'Register'}
                        >
                          {myRegistrations.includes(course.id) ? 'Deregister' : 'Register'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCourses.length === 0 && (
            <div className="no-results">
              <FiBook size={48} />
              <p>No courses found matching your criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* Card View */}
      {viewMode === 'card' && (
        <div className="courses-grid">
          {filteredCourses.map(course => (
            <div key={course.id} className="course-card">
              <div className="course-card-header">
                <div>
                  <h3 className="course-card-code">{course.code}</h3>
                  <h2 className="course-card-name">{course.name}</h2>
                </div>
                <span className={`badge badge-${course.category.toLowerCase()}`}>
                  {course.category}
                </span>
              </div>

              <div className="course-card-body">
                <p className="course-description">{course.description}</p>

                <div className="course-details-grid">
                  <div className="detail-item">
                    <FiAward className="detail-icon" />
                    <div>
                      <span className="detail-label">Credits</span>
                      <span className="detail-value">{course.credits}</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <FiBriefcase className="detail-icon" />
                    <div>
                      <span className="detail-label">Faculty</span>
                      <span className="detail-value">{course.faculty}</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <FiUsers className="detail-icon" />
                    <div>
                      <span className="detail-label">Semester</span>
                      <span className="detail-value">{course.semester}</span>
                    </div>
                  </div>
                </div>

                {/* Enrollment Status */}
                <div className="enrollment-card">
                  <div className="enrollment-header">
                    <span className="enrollment-label">Enrollment</span>
                    <span className={`enrollment-percentage ${getOccupancyPercentage(course) > 80 ? 'high' : ''}`}>
                      {getOccupancyPercentage(course)}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${getOccupancyPercentage(course)}%` }}
                    ></div>
                  </div>
                  <div className="enrollment-info">
                    <span>{course.enrolled} enrolled</span>
                    <span>{getAvailableSeats(course)} seats available</span>
                  </div>
                </div>

                {/* Prerequisites */}
                {course.prerequisites.length > 0 && (
                  <div className="prerequisites">
                    <span className="prereq-label">Prerequisites:</span>
                    <div className="prereq-list">
                      {course.prerequisites.map((prereq, idx) => (
                        <span key={idx} className="prereq-badge">{prereq}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="course-card-footer">
                <button
                  onClick={() => openCourseModal(course)}
                  className="btn-secondary"
                >
                  View Details
                </button>
                {isStudent && (
                  <button
                    onClick={() => handleRegister(course.id)}
                    className={`btn-primary ${myRegistrations.includes(course.id) ? 'registered' : ''}`}
                    disabled={course.status === 'full' && !myRegistrations.includes(course.id)}
                  >
                    {myRegistrations.includes(course.id) ? '✓ Registered' : 'Register'}
                  </button>
                )}
              </div>
            </div>
          ))}
          {filteredCourses.length === 0 && (
            <div className="no-results">
              <FiBook size={48} />
              <p>No courses found matching your criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* Course Details Modal */}
      {modalOpen && selectedCourse && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{selectedCourse.name}</h2>
                <p className="modal-subtitle">{selectedCourse.code}</p>
              </div>
              <button onClick={closeModal} className="modal-close">
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-section">
                <h3>Course Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Faculty</span>
                    <span className="info-value">{selectedCourse.faculty}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Credits</span>
                    <span className="info-value">{selectedCourse.credits}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Category</span>
                    <span className="info-value">{selectedCourse.category}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Semester</span>
                    <span className="info-value">{selectedCourse.semester}</span>
                  </div>
                </div>
              </div>

              <div className="modal-section">
                <h3>Description</h3>
                <p className="description-text">{selectedCourse.description}</p>
              </div>

              <div className="modal-section">
                <h3>Enrollment Status</h3>
                <div className="enrollment-details">
                  <div className="enrollment-stat">
                    <span className="stat-label">Total Capacity</span>
                    <span className="stat-value">{selectedCourse.capacity}</span>
                  </div>
                  <div className="enrollment-stat">
                    <span className="stat-label">Enrolled</span>
                    <span className="stat-value">{selectedCourse.enrolled}</span>
                  </div>
                  <div className="enrollment-stat">
                    <span className="stat-label">Available</span>
                    <span className="stat-value available">{getAvailableSeats(selectedCourse)}</span>
                  </div>
                </div>
                <div className="progress-bar modal-progress">
                  <div
                    className="progress-fill"
                    style={{ width: `${getOccupancyPercentage(selectedCourse)}%` }}
                  ></div>
                </div>
              </div>

              {selectedCourse.prerequisites.length > 0 && (
                <div className="modal-section">
                  <h3>Prerequisites</h3>
                  <div className="prerequisites-list">
                    {selectedCourse.prerequisites.map((prereq, idx) => (
                      <span key={idx} className="prereq-item">{prereq}</span>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(selectedCourse.members) && selectedCourse.members.length > 0 && (
                <div className="modal-section">
                  <h3>Registered Members ({selectedCourse.members.length})</h3>
                  <div className="members-list">
                    {selectedCourse.members.map((member) => (
                      <span key={member.id} className="member-pill" title={member.name}>
                        {member.rollNo}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={closeModal} className="btn-secondary">
                Close
              </button>
              {isStudent && (
                <button
                  onClick={() => {
                    handleRegister(selectedCourse.id);
                    closeModal();
                  }}
                  className={`btn-primary ${myRegistrations.includes(selectedCourse.id) ? 'registered' : ''}`}
                  disabled={selectedCourse.status === 'full' && !myRegistrations.includes(selectedCourse.id)}
                >
                  {myRegistrations.includes(selectedCourse.id) ? '✓ Registered' : 'Register'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseRegistration;
