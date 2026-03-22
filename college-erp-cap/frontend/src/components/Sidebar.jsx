import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaGraduationCap,
  FaCalendar,
  FaFile,
  FaClipboard,
  FaTh,
  FaChartLine,
  FaLock,
  FaTrophy,
  FaUser,
  FaUsers
} from 'react-icons/fa';
import './Sidebar.css';

const sidebarMenu = [
  {
    title: 'Academics',
    icon: 'graduation-cap',
    children: [
      { title: '3.2 Student Attendance View', path: '/student/attendance' },
      { title: '4.0 Final Year Project - I', path: '/student/final-year-project' }
    ]
  },
  {
    title: 'Booking Service',
    icon: 'calendar',
    children: [
      { title: 'AO Service Support', path: '/student/ao-service' },
      { title: 'Fusion Space', path: '/student/fusion-space' }
    ]
  },
  {
    title: 'CFAC',
    icon: 'file',
    children: [
      { title: 'Course Registrations', path: '/student/course-registration' }
    ]
  },
  {
    title: 'COE',
    icon: 'clipboard',
    children: [
      { title: '1.0 Nominal Roll', path: '/student/nominal-roll' },
      { title: '1.1 Nominal Roll Courses', path: '/student/nominal-roll-courses' },
      { title: '1.2 Waiver', path: '/student/waiver' },
      { title: '2.1 Hall Ticket View & Download', path: '/student/hall-ticket' }
    ]
  },
  {
    title: 'Common Service',
    icon: 'grid',
    children: [
      { title: 'Digital Assets', path: '/student/digital-assets' },
      { title: 'Event List & Registrations', path: '/student/events' },
      { title: 'Gym Subscription', path: '/student/gym' },
      { title: 'I-BOX (Internal Complaints)', path: '/student/complaints' },
      { title: 'ID Card & Accessories Reissue', path: '/student/id-card' },
      { title: 'WiFi Request', path: '/student/wifi-request' }
    ]
  },
  {
    title: 'IQAC',
    icon: 'bar-chart',
    children: [
      { title: '2. Feedback Users and Reports', path: '/student/feedback-reports' },
      { title: '3. Take Feedback', path: '/student/take-feedback' }
    ]
  },
  {
    title: 'Main Gate',
    icon: 'shield',
    children: [
      { title: '1. Gatepass', path: '/student/gatepass' },
      { title: '3. Latecomers - All Students', path: '/student/latecomers' },
      { title: '4. Free Outing - Hostel Students', path: '/student/free-outing' }
    ]
  },
  {
    title: 'NDC',
    icon: 'award',
    children: [
      { title: 'Participation & Achievement', path: '/student/achievements' }
    ]
  },
  {
    title: 'Student Service',
    icon: 'user',
    children: [
      { title: 'Bonafide Application', path: '/student/bonafide' }
    ]
  },
  {
    title: 'User Service',
    icon: 'users',
    children: [
      { title: 'Hostel Applications', path: '/student/hostel-app' },
      { title: 'Hostel Attendance', path: '/student/hostel-attendance' },
      { title: 'Hostel Stay Permission', path: '/student/hostel-permission' },
      { title: 'Users', path: '/student/users' }
    ]
  }
];

const iconMap = {
  'graduation-cap': FaGraduationCap,
  calendar: FaCalendar,
  file: FaFile,
  clipboard: FaClipboard,
  grid: FaTh,
  'bar-chart': FaChartLine,
  shield: FaLock,
  award: FaTrophy,
  user: FaUser,
  users: FaUsers
};

export default function Sidebar() {
  const [openIndex, setOpenIndex] = useState(null);
  const navigate = useNavigate();

  const handleMenuClick = (path) => {
    navigate(path);
  };

  const getIcon = (iconName) => {
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent /> : null;
  };

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {sidebarMenu.map((menu, index) => (
          <div key={index} className="sidebar-menu-group">
            {/* Parent menu item */}
            <div
              className="sidebar-menu-parent"
              onClick={() => setOpenIndex(index === openIndex ? null : index)}
            >
              <div className="sidebar-menu-icon">{getIcon(menu.icon)}</div>
              <span className="sidebar-menu-title">{menu.title}</span>
              <span className="sidebar-menu-toggle">
                {openIndex === index ? '▲' : '▼'}
              </span>
            </div>

            {/* Child menu items */}
            {openIndex === index && (
              <div className="sidebar-children">
                {menu.children.map((child, i) => (
                  <div
                    key={i}
                    className="sidebar-child-item"
                    onClick={() => handleMenuClick(child.path)}
                  >
                    <span className="sidebar-child-title">{child.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
