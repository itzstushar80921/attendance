import { Router } from 'express';
import { studentController } from '../controllers/studentController.js';

const router = Router();

// 1. Static subpaths MUST come before parameterized /:id routes
router.get('/courses', studentController.getCourses);
router.get('/courses/all', studentController.getCourses);
router.post('/courses', studentController.createCourse);
router.delete('/courses/:id', studentController.deleteCourse);

router.post('/bulk-batch', studentController.bulkUpdateBatches);
router.post('/rename-batch', studentController.renameBatch);

// 2. Base collection routes
router.get('/', studentController.getStudents);
router.post('/', studentController.createStudent);

// 3. Parameterized routes
router.patch('/:id/batch', studentController.updateStudentBatch);
router.get('/:id', studentController.getStudentById);

export default router;
