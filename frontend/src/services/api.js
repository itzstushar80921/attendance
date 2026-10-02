/**
 * Frontend API Client for College Mobile Attendance Portal
 * Configured for both local development and Vercel -> Render production deployment
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }
  return response.json();
}

export const api = {
  // Health & diagnostics
  async checkHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse(res);
  },

  // Students & Courses
  async getStudents(params = {}) {
    const query = new URLSearchParams();
    if (params.semester) query.append('semester', params.semester);
    if (params.section) query.append('section', params.section);
    if (params.lab_batch && params.lab_batch !== 'All') query.append('lab_batch', params.lab_batch);
    if (params.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE}/students?${query.toString()}`);
    return handleResponse(res);
  },

  async getCourses() {
    const res = await fetch(`${API_BASE}/students/courses`);
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
