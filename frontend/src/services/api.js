/**
 * Frontend API Client for College Mobile Attendance Portal
 * Configured for both local development (localhost & mobile LAN) and Vercel -> Render production deployment
 */

// Dynamically resolve API URL so that mobile phones accessing via LAN IP (e.g. http://192.168.1.X:5173)
// do not erroneously attempt to call http://localhost:5000 directly.
const resolveApiBase = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl || envUrl.trim() === '') {
    return '/api';
  }
  
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // If env URL hardcodes localhost but browser is running on a phone/LAN IP:
    if (!isLocalhost && envUrl.includes('localhost')) {
      return envUrl.replace('localhost', window.location.hostname);
    }
  }
  return envUrl;
};

const API_BASE = resolveApiBase();

async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }
  return response.json();
}

// Built-in standard courses fallback so the course selector is never blank under any network condition
export const DEFAULT_COURSES = [
  { code: 'CS501', name: 'Database Management Systems', semester: 5, credits: 4, has_lab: true },
  { code: 'CS502', name: 'Operating Systems', semester: 5, credits: 4, has_lab: true },
  { code: 'CS503', name: 'Computer Networks', semester: 5, credits: 4, has_lab: true },
  { code: 'CS504', name: 'Design & Analysis of Algorithms', semester: 5, credits: 4, has_lab: false },
  { code: 'CS505', name: 'Web Technologies & Cloud Computing', semester: 5, credits: 3, has_lab: true },
  { code: 'DCD01', name: 'DIGITAL CIRCUITAL DESIGN', semester: 3, credits: 3, has_lab: true }
];

export const api = {
  // Health & diagnostics
  async checkHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse(res);
  },

  // Students & Batches
  async getStudents(params = {}) {
    const query = new URLSearchParams();
    if (params.semester) query.append('semester', params.semester);
    if (params.section) query.append('section', params.section);
    if (params.lab_batch && params.lab_batch !== 'All') query.append('lab_batch', params.lab_batch);
    if (params.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE}/students?${query.toString()}`);
    return handleResponse(res);
  },

  async addStudent(data) {
    const res = await fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Batch group editing & customization
  async updateStudentBatch(studentId, batch) {
    const res = await fetch(`${API_BASE}/students/${studentId}/batch`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lab_batch: batch })
    });
    return handleResponse(res);
  },

  async bulkUpdateBatches(studentIds, batch) {
    const res = await fetch(`${API_BASE}/students/bulk-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_ids: studentIds, lab_batch: batch })
    });
    return handleResponse(res);
  },

  async renameBatch(oldBatch, newBatch) {
    const res = await fetch(`${API_BASE}/students/rename-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ old_batch: oldBatch, new_batch: newBatch })
    });
    return handleResponse(res);
  },

  // Courses
  async getCourses() {
    try {
      const res = await fetch(`${API_BASE}/students/courses`);
      const data = await handleResponse(res);
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        return data;
      }
      return { success: true, data: DEFAULT_COURSES };
    } catch (err) {
      console.warn('Network issue fetching courses, using resilient defaults:', err.message);
      return { success: true, data: DEFAULT_COURSES };
    }
  },

  async addCourse(courseData) {
    const res = await fetch(`${API_BASE}/students/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(courseData)
    });
    return handleResponse(res);
  },

  async deleteCourse(courseIdOrCode) {
    const res = await fetch(`${API_BASE}/students/courses/${courseIdOrCode}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  // Sessions (Lecture vs Lab)
  async createSession(sessionData) {
    const res = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData)
    });
    return handleResponse(res);
  },

  async getSessions(params = {}) {
    const query = new URLSearchParams();
    if (params.class_type && params.class_type !== 'all') query.append('class_type', params.class_type);
    if (params.course_code) query.append('course_code', params.course_code);
    if (params.semester) query.append('semester', params.semester);
    if (params.date) query.append('date', params.date);

    const res = await fetch(`${API_BASE}/sessions?${query.toString()}`);
    return handleResponse(res);
  },

  async getSessionById(id) {
    const res = await fetch(`${API_BASE}/sessions/${id}`);
    return handleResponse(res);
  },

  async deleteSession(id) {
    const res = await fetch(`${API_BASE}/sessions/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  // Attendance Records
  async submitAttendance(sessionId, records) {
    const res = await fetch(`${API_BASE}/attendance/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, records })
    });
    return handleResponse(res);
  },

  async updateSingleRecord(data) {
    const res = await fetch(`${API_BASE}/attendance/single`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Reports
  async getUnifiedReport(params = {}) {
    const query = new URLSearchParams();
    if (params.semester) query.append('semester', params.semester);
    if (params.month && params.month !== 'all') query.append('month', params.month);
    if (params.course_code) query.append('course_code', params.course_code);
    if (params.section) query.append('section', params.section);

    const res = await fetch(`${API_BASE}/reports/unified?${query.toString()}`);
    return handleResponse(res);
  },

  async getStudentDetailedReport(studentId) {
    const res = await fetch(`${API_BASE}/reports/student/${studentId}`);
    return handleResponse(res);
  }
};
