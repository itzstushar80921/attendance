# 📱 ProfAttend: College Mobile Attendance Portal

> A modern, mobile-first web application designed for college professors to take attendance directly from their mobile phones for both **Lectures** and **Practical Labs**, with database integration in **Supabase**, backend ready for **Render**, and frontend ready for **Vercel**.

---

## 🌟 Key Features

1. **Predefined Student Roster**:
   - Stores student names, unique roll numbers, departments, semesters, sections, and lab batch divisions (`B1`, `B2`).
   - Integrated with Supabase PostgreSQL (with automatic fallback to a high-fidelity in-memory mock database if credentials are not yet supplied).

2. **Lecture vs. Lab Separation**:
   - Professors select class type (**Lecture 📚** or **Practical Lab 🔬**) before starting.
   - For Labs: allows filtering by specific batch groups (`Batch B1`, `Batch B2`, or `All`).
   - Attendance sessions are stored with distinct `class_type`, course codes, dates, time slots, and topic covered.

3. **Unified Attendance Reporting**:
   - Consolidates lecture attendance and lab attendance into one unified report.
   - **Lecture Attendance**: Conducted, Attended, Absent, and Percentage %.
   - **Lab Attendance**: Conducted, Attended, Absent, and Percentage %.
   - **Overall Attendance**: Combined total sessions conducted vs. attended.
   - Low attendance warning badge for students below the **75% minimum threshold** (AICTE/UGC college norm).
   - **Export to CSV**: Downloadable official report spreadsheet.

4. **Detailed Student Drill-Down**:
   - Monthly and semester-wise attendance breakdowns for each individual student.
   - Session-by-session history logs displaying date, time, subject, topic, and status (Present, Absent, Late) with remarks.

5. **Mobile-Optimized Touch Interface**:
   - Big, thumb-friendly touch targets: **Present (Green)**, **Absent (Red)**, **Late (Amber)**.
   - Quick bulk actions: **All Present**, **All Absent**, and live attendance rate progress bar.
   - Sticky header and bottom navigation bar tailored for iOS and Android mobile screens.

6. **Interactive Visualizations**:
   - Monthly Lecture vs. Lab comparison bar chart (via Recharts).
   - Exam eligibility donut chart (&ge; 75% vs. &lt; 75% shortage).

---

## 🏗️ Project Architecture

```
d:\attendance\
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.js         # Supabase client + demo DB fallback
│   │   ├── controllers/
│   │   │   ├── studentController.js   # Student roster & courses logic
│   │   │   ├── sessionController.js   # Lecture/Lab session management
│   │   │   ├── attendanceController.js# Bulk attendance marking & upsert
│   │   │   └── reportController.js    # Unified & detailed student analytics
│   │   ├── routes/
│   │   │   ├── studentRoutes.js
│   │   │   ├── sessionRoutes.js
│   │   │   ├── attendanceRoutes.js
│   │   │   └── reportRoutes.js
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   └── server.js               # Express server with CORS & health check
│   ├── package.json
│   ├── .env.example
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Top brand and DB status badge
│   │   │   ├── BottomNav.jsx       # Mobile bottom navigation tabs
│   │   │   ├── SessionSelector.jsx # Lecture vs Lab switcher & configurator
│   │   │   ├── StudentCard.jsx     # Mobile touch toggle for P / A / L
│   │   │   ├── AttendanceSheet.jsx # Active marking sheet with live stats
│   │   │   ├── AttendanceCharts.jsx# Recharts monthly trends & pie chart
│   │   │   ├── UnifiedReport.jsx   # Consolidated report & CSV export
│   │   │   └── StudentDetailModal.jsx # Single student monthly/semester drill-down
│   │   ├── pages/
│   │   │   ├── TakeAttendancePage.jsx
│   │   │   ├── HistoryPage.jsx
│   │   │   └── StudentsPage.jsx
│   │   ├── services/
│   │   │   └── api.js              # Fetch client connecting to backend
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── vercel.json                 # SPA routing rewrites for Vercel
│   ├── vite.config.js              # Host enabled for local WiFi mobile testing
│   ├── tailwind.config.js
│   ├── package.json
│   └── .env
├── supabase/
│   ├── schema.sql                  # PostgreSQL tables, constraints, indexes & RLS
│   └── seed.sql                    # Predefined students, courses, sample lectures & labs
├── .vscode/
│   ├── tasks.json                  # Single-click run in VS Code
│   └── launch.json                 # Node.js backend debugger
├── render.yaml                     # Render Web Service blueprint
└── README.md
```

---

## ⚡ Quick Start in Visual Studio Code

### Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)

### 1. Run in Visual Studio Code
You can launch both the frontend and backend with a single click:
1. Open the project folder `d:\attendance` in VS Code (`code .`).
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) and choose **Tasks: Run Task**.
3. Select **`Start Fullstack Attendance System`**.
4. Both servers will start:
   - **Backend API**: `http://localhost:5000` (Health check: `http://localhost:5000/api/health`)
   - **Frontend UI**: `http://localhost:5173`

Or run via terminal:
```bash
# Terminal 1 - Backend:
cd backend
npm run dev

# Terminal 2 - Frontend:
cd frontend
npm run dev
```

### 2. Testing Directly on your Mobile Phone over WiFi
Because `frontend/vite.config.js` is configured with `host: true`, Vite prints a network URL upon starting:
```text
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.1.X:5173/
```
Open that `http://192.168.1.X:5173` URL in Safari or Chrome on your mobile phone connected to the same WiFi. The interface is optimized with native mobile touch targets!

---

## 🗄️ Supabase Database Setup

### Step 1: Create a Supabase Project
1. Log in to [Supabase](https://supabase.com) and create a new project (e.g. `college-attendance`).
2. Note your **Database Password** and select the region closest to you.

### Step 2: Run SQL Schema and Seed
1. In the Supabase Dashboard, navigate to **SQL Editor** (left sidebar).
2. Click **New Query**.
3. Copy and paste the contents of `supabase/schema.sql` into the editor and click **Run**.
   - This creates tables: `students`, `courses`, `attendance_sessions`, and `attendance_records` with constraints and indexes.
4. Open a second query, copy and paste the contents of `supabase/seed.sql`, and click **Run**.
   - This populates predefined students (`2024CS001` to `2024CS020`), courses, and historical lecture & lab sessions.

### Step 3: Get API Keys
1. In Supabase, go to **Project Settings** (gear icon) -> **API**.
2. Copy:
   - **Project URL** (e.g., `https://xyzcompany.supabase.co`)
   - **anon / public key** (starts with `eyJhbGciOi...`)

### Step 4: Configure Backend Environment
Edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...your-anon-key...
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```
Restart the backend (`npm run dev`). The status badge in the top right will turn green: **Supabase Connected**!

---

## 🚀 Deployment Instructions

### A. Deploy Backend to Render

1. Push your repository to GitHub or GitLab.
2. Log in to [Render](https://render.com) and click **New +** -> **Web Service**.
3. Select your repository.
4. Configure service settings:
   - **Name**: `college-attendance-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   - `PORT`: `10000`
   - `NODE_ENV`: `production`
   - `SUPABASE_URL`: `https://your-project-id.supabase.co`
   - `SUPABASE_ANON_KEY`: `eyJhbGciOi...`
   - `ALLOWED_ORIGINS`: `https://your-frontend.vercel.app`
6. Click **Create Web Service**.
7. Note down your backend URL: e.g. `https://college-attendance-backend.onrender.com`.
8. Verify health check: `https://college-attendance-backend.onrender.com/api/health`.

*(Note: `render.yaml` is also included at the project root for 1-click Render Blueprint deployment).*

---

### B. Deploy Frontend to Vercel

1. Log in to [Vercel](https://vercel.com) and click **Add New...** -> **Project**.
2. Import your GitHub repository.
3. In project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click edit and select `frontend`
4. Under **Environment Variables**, add:
   - `VITE_API_URL`: `https://college-attendance-backend.onrender.com/api`
5. Click **Deploy**.
6. Vercel will build and provide a production URL (e.g., `https://college-attendance.vercel.app`).
7. Update `ALLOWED_ORIGINS` in your Render backend settings to include your Vercel URL.

---

## 📖 API Reference

### Health Check
- `GET /api/health`: Returns server status, current timestamp, and whether Supabase is connected.

### Students & Courses
- `GET /api/students`: List students (filters: `?semester=5&section=A&lab_batch=B1&search=Aarav`).
- `GET /api/students/courses`: List registered courses.
- `GET /api/students/:id`: Get single student information.
- `POST /api/students`: Add new student to database.

### Sessions
- `GET /api/sessions`: List sessions (filters: `?class_type=lecture|lab&course_code=CS501&semester=5`).
- `POST /api/sessions`: Create new session.
  ```json
  {
    "class_type": "lecture",
    "course_code": "CS501",
    "course_name": "Database Management Systems",
    "date": "2026-10-02",
    "time_slot": "09:00 AM - 10:00 AM",
    "semester": 5,
    "section": "A",
    "lab_batch": "All",
    "topic_covered": "Relational Algebra",
    "location": "LH-201"
  }
  ```
- `GET /api/sessions/:id`: Get session details along with marked student records.
- `DELETE /api/sessions/:id`: Delete session and cascade records.

### Attendance
- `POST /api/attendance/submit`: Bulk submit or update attendance records for a session.
  ```json
  {
    "session_id": "uuid-or-id",
    "records": [
      { "student_id": "uuid-1", "status": "present" },
      { "student_id": "uuid-2", "status": "absent", "remarks": "Medical" },
      { "student_id": "uuid-3", "status": "late" }
    ]
  }
  ```

### Reports
- `GET /api/reports/unified`: Aggregated report showing Lecture %, Lab %, Overall %, and monthly trends for all students.
  - Query parameters: `?semester=5&month=2026-10&course_code=CS501`
- `GET /api/reports/student/:studentId`: Complete monthly and semester-wise drill-down for a single student, including full session timeline.

---

## 🔒 Security & Best Practices
- **Row Level Security (RLS)** is enabled on all Supabase tables.
- Input validation and parameterized SQL via Supabase JS SDK prevent SQL injection.
- Mobile safe-area insets and touch feedback prevent double-taps or misclicks during fast attendance marking.
