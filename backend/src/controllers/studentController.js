import { supabase, isSupabaseConfigured, mockDb } from '../config/supabase.js';

/**
 * Controller for Student operations
 */
export const studentController = {
  /**
   * Get all students with optional filters (semester, section, lab_batch, search)
   */
  async getStudents(req, res, next) {
    try {
      const { semester, section, lab_batch, search } = req.query;

      if (isSupabaseConfigured) {
        let query = supabase
          .from('students')
          .select('*')
          .order('roll_number', { ascending: true });

        if (semester) query = query.eq('semester', parseInt(semester, 10));
        if (section) query = query.eq('section', section);
        if (lab_batch && lab_batch !== 'All') query = query.eq('lab_batch', lab_batch);
        if (search) {
          query = query.or(`name.ilike.%${search}%,roll_number.ilike.%${search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return res.json({ success: true, count: data.length, data });
      }

      // Mock database fallback
      let list = [...mockDb.students];
      if (semester) list = list.filter(s => s.semester === parseInt(semester, 10));
      if (section) list = list.filter(s => s.section === section);
      if (lab_batch && lab_batch !== 'All') list = list.filter(s => s.lab_batch === lab_batch);
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(s => s.name.toLowerCase().includes(q) || s.roll_number.toLowerCase().includes(q));
      }

      list.sort((a, b) => a.roll_number.localeCompare(b.roll_number));
      return res.json({ success: true, count: list.length, data: list });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get student by ID
   */
  async getStudentById(req, res, next) {
    try {
      const { id } = req.params;

      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('id', id)
          .single();

        if (error) return res.status(404).json({ success: false, message: 'Student not found' });
        return res.json({ success: true, data });
      }

      const student = mockDb.students.find(s => s.id === id || s.roll_number === id);
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

      return res.json({ success: true, data: student });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Add a new student
   */
  async createStudent(req, res, next) {
    try {
      const { roll_number, name, email, department, semester, section, lab_batch, phone } = req.body;

      if (!roll_number || !name) {
        return res.status(400).json({ success: false, message: 'Roll number and name are required' });
      }

      const newStudent = {
        roll_number: roll_number.trim().toUpperCase(),
        name: name.trim(),
        email: email ? email.trim() : `${roll_number.toLowerCase()}@college.edu`,
        department: department || 'Computer Science & Engineering',
        semester: semester ? parseInt(semester, 10) : 5,
        section: section ? section.trim().toUpperCase() : 'A',
        lab_batch: lab_batch ? lab_batch.trim().toUpperCase() : 'B1',
        phone: phone || ''
      };

      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('students')
          .insert([newStudent])
          .select()
          .single();

        if (error) throw error;
        return res.status(201).json({ success: true, data });
      }

      const id = 's' + (mockDb.students.length + 1).toString().padStart(2, '0');
      const studentWithId = { id, ...newStudent };
      mockDb.students.push(studentWithId);

      return res.status(201).json({ success: true, data: studentWithId });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get available courses
   */
  async getCourses(req, res, next) {
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .order('code', { ascending: true });

        if (error) throw error;
        return res.json({ success: true, data });
      }

      return res.json({ success: true, data: mockDb.courses });
    } catch (err) {
      next(err);
    }
  }
};
