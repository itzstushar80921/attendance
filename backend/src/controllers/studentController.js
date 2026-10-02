import { supabase, isSupabaseConfigured, mockDb } from '../config/supabase.js';

/**
 * Controller for Student operations, Batches, and Course Management
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

        if (semester && semester !== 'all') {
          query = query.eq('semester', parseInt(semester, 10));
        }
        if (section) query = query.eq('section', section);
        if (lab_batch && lab_batch !== 'All') query = query.eq('lab_batch', lab_batch);
        if (search) {
          query = query.or(`name.ilike.%${search}%,roll_number.ilike.%${search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Also extract distinct batches currently existing
        const batches = [...new Set((data || []).map(s => s.lab_batch).filter(Boolean))].sort();

        return res.json({ success: true, count: data.length, batches, data });
      }

      // Mock database fallback
      let list = [...mockDb.students];
      if (semester && semester !== 'all') {
        list = list.filter(s => s.semester === parseInt(semester, 10));
      }
      if (section) list = list.filter(s => s.section === section);
      if (lab_batch && lab_batch !== 'All') list = list.filter(s => s.lab_batch === lab_batch);
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(s => s.name.toLowerCase().includes(q) || s.roll_number.toLowerCase().includes(q));
      }

      list.sort((a, b) => a.roll_number.localeCompare(b.roll_number));
      const batches = [...new Set(mockDb.students.map(s => s.lab_batch).filter(Boolean))].sort();

      return res.json({ success: true, count: list.length, batches, data: list });
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
   * Add a new student or update existing with duplicate detection
   */
  async createStudent(req, res, next) {
    try {
      const { 
        roll_number, 
        name, 
        email, 
        department, 
        semester, 
        section, 
        lab_batch, 
        phone, 
        update_if_exists 
      } = req.body;

      if (!roll_number || !name) {
        return res.status(400).json({ success: false, message: 'Roll number and student name are required' });
      }

      const cleanRoll = roll_number.trim().toUpperCase();
      const newStudent = {
        roll_number: cleanRoll,
        name: name.trim(),
        email: email && email.trim() ? email.trim() : `${cleanRoll.toLowerCase()}@college.edu`,
        department: department || 'Computer Science & Engineering',
        semester: semester ? parseInt(semester, 10) : 5,
        section: section ? section.trim().toUpperCase() : 'A',
        lab_batch: lab_batch ? lab_batch.trim().toUpperCase() : 'B1',
        phone: phone ? phone.trim() : ''
      };

      if (isSupabaseConfigured) {
        // Check if student with this roll number already exists
        const { data: existing, error: checkErr } = await supabase
          .from('students')
          .select('id, roll_number, name, lab_batch, semester')
          .eq('roll_number', cleanRoll)
          .maybeSingle();

        if (existing) {
          if (update_if_exists) {
            // Update existing student record
            const { data, error } = await supabase
              .from('students')
              .update({ ...newStudent, updated_at: new Date().toISOString() })
              .eq('id', existing.id)
              .select()
              .single();

            if (error) throw error;
            return res.json({ 
              success: true, 
              message: `Student ${cleanRoll} (${newStudent.name}) updated successfully!`, 
              data 
            });
          } else {
            return res.status(409).json({
              success: false,
              isDuplicate: true,
              message: `Roll Number "${cleanRoll}" is already assigned to "${existing.name}" (Semester ${existing.semester}, Batch ${existing.lab_batch}).`,
              existingStudent: existing
            });
          }
        }

        // Insert new record
        const { data, error } = await supabase
          .from('students')
          .insert([newStudent])
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            return res.status(409).json({
              success: false,
              message: `Duplicate entry: A student with this roll number or email already exists.`
            });
          }
          throw error;
        }

        return res.status(201).json({ 
          success: true, 
          message: `Student ${newStudent.name} (${cleanRoll}) added successfully to Semester ${newStudent.semester}, Batch ${newStudent.lab_batch}!`, 
          data 
        });
      }

      // Mock database fallback
      const existingIdx = mockDb.students.findIndex(s => s.roll_number === cleanRoll);
      if (existingIdx >= 0) {
        if (update_if_exists) {
          mockDb.students[existingIdx] = { ...mockDb.students[existingIdx], ...newStudent };
          return res.json({ success: true, message: `Student ${cleanRoll} updated successfully!`, data: mockDb.students[existingIdx] });
        } else {
          return res.status(409).json({
            success: false,
            isDuplicate: true,
            message: `Roll Number "${cleanRoll}" is already registered to "${mockDb.students[existingIdx].name}".`,
            existingStudent: mockDb.students[existingIdx]
          });
        }
      }

      const id = 's' + (mockDb.students.length + 1).toString().padStart(2, '0');
      const studentWithId = { id, ...newStudent };
      mockDb.students.push(studentWithId);

      return res.status(201).json({ 
        success: true, 
        message: `Student ${newStudent.name} (${cleanRoll}) added successfully!`, 
        data: studentWithId 
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Delete student
   */
  async deleteStudent(req, res, next) {
    try {
      const { id } = req.params;

      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('students')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return res.json({ success: true, message: 'Student removed from database' });
      }

      mockDb.students = mockDb.students.filter(s => s.id !== id && s.roll_number !== id);
      return res.json({ success: true, message: 'Student removed from database' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Update student's batch group (Professor customized batch)
   */
  async updateStudentBatch(req, res, next) {
    try {
      const { id } = req.params;
      const { lab_batch } = req.body;

      if (!lab_batch) {
        return res.status(400).json({ success: false, message: 'lab_batch is required' });
      }

      const cleanBatch = lab_batch.trim().toUpperCase();

      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('students')
          .update({ lab_batch: cleanBatch, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return res.json({ success: true, message: `Batch updated to ${cleanBatch}`, data });
      }

      const student = mockDb.students.find(s => s.id === id || s.roll_number === id);
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

      student.lab_batch = cleanBatch;
      return res.json({ success: true, message: `Batch updated to ${cleanBatch}`, data: student });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Bulk assign batch to multiple students
   */
  async bulkUpdateBatches(req, res, next) {
    try {
      const { student_ids, lab_batch } = req.body;

      if (!Array.isArray(student_ids) || student_ids.length === 0 || !lab_batch) {
        return res.status(400).json({ success: false, message: 'student_ids array and lab_batch are required' });
      }

      const cleanBatch = lab_batch.trim().toUpperCase();

      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('students')
          .update({ lab_batch: cleanBatch, updated_at: new Date().toISOString() })
          .in('id', student_ids)
          .select();

        if (error) throw error;
        return res.json({ success: true, message: `${student_ids.length} students reassigned to Batch ${cleanBatch}`, count: data.length });
      }

      mockDb.students.forEach(st => {
        if (student_ids.includes(st.id)) {
          st.lab_batch = cleanBatch;
        }
      });

      return res.json({ success: true, message: `${student_ids.length} students reassigned to Batch ${cleanBatch}`, count: student_ids.length });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Rename an entire batch (e.g. B1 -> Group-A)
   */
  async renameBatch(req, res, next) {
    try {
      const { old_batch, new_batch } = req.body;

      if (!old_batch || !new_batch) {
        return res.status(400).json({ success: false, message: 'old_batch and new_batch are required' });
      }

      const cleanOld = old_batch.trim().toUpperCase();
      const cleanNew = new_batch.trim().toUpperCase();

      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('students')
          .update({ lab_batch: cleanNew, updated_at: new Date().toISOString() })
          .eq('lab_batch', cleanOld)
          .select();

        if (error) throw error;
        return res.json({ success: true, message: `Batch ${cleanOld} renamed to ${cleanNew}`, updatedCount: data.length });
      }

      let count = 0;
      mockDb.students.forEach(st => {
        if (st.lab_batch === cleanOld) {
          st.lab_batch = cleanNew;
          count++;
        }
      });

      return res.json({ success: true, message: `Batch ${cleanOld} renamed to ${cleanNew}`, updatedCount: count });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get available courses (with fail-safe fallback courses)
   */
  async getCourses(req, res, next) {
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .order('code', { ascending: true });

        if (error) throw error;

        // If table is empty, populate standard default courses into Supabase
        if (!data || data.length === 0) {
          const defaults = [
            { code: 'CS501', name: 'Database Management Systems', department: 'Computer Science & Engineering', semester: 5, credits: 4, has_lab: true },
            { code: 'CS502', name: 'Operating Systems', department: 'Computer Science & Engineering', semester: 5, credits: 4, has_lab: true },
            { code: 'CS503', name: 'Computer Networks', department: 'Computer Science & Engineering', semester: 5, credits: 4, has_lab: true },
            { code: 'CS504', name: 'Design & Analysis of Algorithms', department: 'Computer Science & Engineering', semester: 5, credits: 4, has_lab: false },
            { code: 'CS505', name: 'Web Technologies & Cloud Computing', department: 'Computer Science & Engineering', semester: 5, credits: 3, has_lab: true }
          ];
          await supabase.from('courses').upsert(defaults, { onConflict: 'code' });
          return res.json({ success: true, count: defaults.length, data: defaults });
        }

        return res.json({ success: true, count: data.length, data });
      }

      return res.json({ success: true, count: mockDb.courses.length, data: mockDb.courses });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Add a new course
   */
  async createCourse(req, res, next) {
    try {
      const { code, name, department, semester, credits, has_lab } = req.body;

      if (!code || !name) {
        return res.status(400).json({ success: false, message: 'Course code and name are required' });
      }

      const courseData = {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        department: department || 'Computer Science & Engineering',
        semester: semester ? parseInt(semester, 10) : 5,
        credits: credits ? parseInt(credits, 10) : 4,
        has_lab: has_lab !== undefined ? Boolean(has_lab) : true
      };

      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('courses')
          .upsert([courseData], { onConflict: 'code' })
          .select()
          .single();

        if (error) throw error;
        return res.status(201).json({ success: true, data });
      }

      const existingIdx = mockDb.courses.findIndex(c => c.code === courseData.code);
      if (existingIdx >= 0) {
        mockDb.courses[existingIdx] = { ...mockDb.courses[existingIdx], ...courseData };
      } else {
        mockDb.courses.push({ id: `c-${Date.now()}`, ...courseData });
      }

      return res.status(201).json({ success: true, data: courseData });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Delete course (by UUID or code)
   */
  async deleteCourse(req, res, next) {
    try {
      const { id } = req.params;

      if (isSupabaseConfigured) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        let query = supabase.from('courses').delete();
        if (isUuid) {
          query = query.eq('id', id);
        } else {
          query = query.eq('code', id.toUpperCase());
        }

        const { error } = await query;
        if (error) throw error;
        return res.json({ success: true, message: 'Course deleted successfully' });
      }

      mockDb.courses = mockDb.courses.filter(c => c.id !== id && c.code !== id);
      return res.json({ success: true, message: 'Course deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
};
