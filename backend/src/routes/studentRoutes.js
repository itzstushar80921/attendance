import { Router } from 'express';
import { studentController } from '../controllers/studentController.js';

const router = Router();

// GET /api/students - List students (filter by semester, section, lab_batch, search)
router.get('/', studentController.getStudents);

// GET /api/students/courses - List courses
router.get('/courses', studentController.getCourses);

// GET /api/students/:id - Get single student
router.get('/:id', studentController.getStudentById);

// POST /api/students - Create student
router.post('/', studentController.createStudent);

export default router;
