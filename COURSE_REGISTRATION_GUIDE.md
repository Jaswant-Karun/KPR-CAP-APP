# Course Registration Feature - Implementation Guide

## 📋 Overview

A comprehensive course registration system for both **Students** and **Faculty** with dark UI design matching your KPR-ERP application.

## ✨ Features Implemented

### View Modes

- **Table View**: Tabular display with all course details, enrollment status, and action buttons
- **Card View**: Grid/card layout with visual course cards (responsive, collapsible)
- **Toggle Button**: Easy switch between table and card views

### Search & Filter Capabilities

- **Search Box**: Filter by course code, course name, or faculty name
- **Semester Filter**: Filter courses by semester (4, 5, 6, 7, 8)
- **Category Filter**: Filter by course category (PCC, BSC, EEC, OEC, MOOC)
- **Status Filter**: Filter by enrollment status (Open, Full, Closed)
- **Clear Filters**: One-click button to reset all filters

### Course Information Display

- Course Code (e.g., U21AD401)
- Course Name
- Credits
- Faculty Name
- Course Category (with color-coded badges)
- Semester
- Enrollment Status (Open, Full, Closed)
- Enrollment Progress Bar (visual representation)
- Enrollment Numbers (Enrolled/Capacity)
- Prerequisites (where applicable)
- Course Description

### Student-Specific Features

- **Register/Deregister**: Toggle course registration with one click
- **Registration Counter**: Shows total courses registered
- **Success Messages**: Confirmation notifications for registration actions
- **Modal Details**: Click "Details" to view complete course information
- **Status Indicators**: Visual feedback for enrolled courses (✓ Registered)

### Faculty-Specific Features

- View all available courses for their classes
- Course management overview
- Enrollment analytics
- Same robust search and filter capabilities

### Responsive Design

- Desktop: Full-featured layout with all details visible
- Tablet: Optimized grid and responsive filters
- Mobile: Single-column layout with collapsible sections

### Modal/Course Details

- Detailed course information popup
- Comprehensive enrollment statistics
- Prerequisites display
- Quick registration from modal

## 🎨 Dark UI Theme

Matches your existing KPR-ERP design with:

- Primary gradient backgrounds
- Accent colors (#35d4ff cyan, #86efac green, #ff6b6b red)
- Dark panels with subtle gradients
- Smooth hover animations
- Consistent spacing and typography

## 📁 Files Created

### New Files

1. **`frontend/src/pages/CourseRegistration.jsx`** (385 lines)
   - Main component with full logic
   - Mock course data (replace with API calls)
   - State management for registrations, filters, search

2. **`frontend/src/pages/CourseRegistration.css`** (700+ lines)
   - Complete styling with dark theme
   - Responsive grid layouts
   - Modal styles
   - Button variants and hover states

### Modified Files

1. **`frontend/src/routes/StudentRoutes.jsx`**
   - Added import for CourseRegistration component
   - Added route: `/student/course-registration`

2. **`frontend/src/routes/FacultyRoutes.jsx`**
   - Added import for CourseRegistration component
   - Added route: `/faculty/course-registration`

3. **`frontend/src/components/Sidebar.jsx`**
   - Already had CFAC menu item linking to course registration

4. **`frontend/src/components/FacultySidebar.jsx`**
   - Added "Courses" menu section
   - Added "Course Registration" link to `/faculty/course-registration`

## 🚀 How to Use

### For Students

1. Navigate to **Sidebar** → **CFAC** → **Course Registrations**
   - Or visit: `/student/course-registration`
2. Browse available courses
3. Use search and filters to find specific courses
4. Click **Register** to enroll in a course
5. Click **Details** for complete course information
6. Toggle between **Table** and **Card** views

### For Faculty

1. Navigate to **Sidebar** → **Courses** → **Course Registration**
   - Or visit: `/faculty/course-registration`
2. View all course offerings
3. Use filters to analyze enrollment patterns
4. Same search and view capabilities as students

## 🔧 Backend Integration (Optional)

To connect to real course data, replace the mock `courses` state in CourseRegistration.jsx:

```javascript
// Current (Mock Data)
const [courses, setCourses] = useState([...mock courses...]);

// Replace with API Call
useEffect(() => {
  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };
  fetchCourses();
}, [token]);
```

## 📊 Course Object Structure

```javascript
{
  id: 1,
  code: 'U21AD401',
  name: 'Machine Learning Essentials',
  credits: 3,
  semester: 4,
  category: 'PCC',
  faculty: 'Dr. Ramakrishnan',
  enrolled: 45,
  capacity: 60,
  prerequisites: ['U21AD301'],
  status: 'open', // 'open', 'full', 'closed'
  description: 'Comprehensive introduction to machine learning...'
}
```

## 💾 Customization Guide

### Colors

Edit CSS variables in `CourseRegistration.css`:

- `--accent`: Main cyan color (#35d4ff)
- `--success`: Green color for open/available (#86efac)
- `--danger`: Red for full/unavailable (#ff6b6b)
- `--warning`: Yellow for high enrollment (#fbbf24)

### Badge Colors

Change category badge colors in `.badge-*` classes:

```css
.badge-pcc { background: rgba(52, 168, 219, 0.2); /* Blue */ }
.badge-eec { background: rgba(249, 115, 22, 0.2); /* Orange */ }
.badge-oec { background: rgba(139, 92, 246, 0.2); /* Purple */ }
.badge-mooc { background: rgba(34, 197, 94, 0.2); /* Green */ }
```

### Grid Columns

Adjust card grid layout:

```css
.courses-grid {
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  /* Change minmax values for different card sizes */
}
```

## 🐛 Troubleshooting

### Course Registration not showing?

- Ensure routes are properly imported in StudentRoutes/FacultyRoutes
- Check sidebar menu links point to correct paths
- Verify useAuth hook returns correct user role

### Styling issues?

- Clear browser cache (Ctrl+Shift+Delete)
- Rebuild frontend: `npm run build`
- Restart dev server: `npm run dev`

### Mock data not updating?

- Edit course data in CourseRegistration.jsx state initialization
- Or implement API integration (see Backend Integration section)

## 📱 Responsive Breakpoints

- **Desktop**: 1200px+ (3-column grid)
- **Tablet**: 768px - 1199px (2-column grid)
- **Mobile**: Below 768px (1-column grid)

## ✅ Validation Checklist

- [x] Frontend builds without errors
- [x] Routes configured for both student and faculty
- [x] Sidebar menu links added
- [x] Search and filter functionality working
- [x] Table and card view toggle working
- [x] Modal details popup functional
- [x] Registration/deregistration logic implemented
- [x] Dark UI theme applied consistently
- [x] Responsive design working
- [x] All imports properly configured

## 🎯 Next Steps

1. **API Integration**: Connect to backend course endpoints
2. **Data Persistence**: Save student registrations to database
3. **Validation**: Implement prerequisite checking
4. **Notifications**: Add email confirmations for registrations
5. **Analytics**: Track enrollment trends and capacity management
6. **Admin Dashboard**: Add course management interface

## 📞 Support

For questions or issues:

- Check the troubleshooting section above
- Review the code comments in CourseRegistration.jsx
- Verify all files are created in correct locations
- Ensure route paths match sidebar links
