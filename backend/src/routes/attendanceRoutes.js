import { Router } from 'express';
import { attendanceController } from '../controllers/attendanceController.js';

const router = Router();

// POST /api/attendance/submit - Submit or update attendance records in bulk
router.post('/submit', attendanceController.submitAttendance);

// POST /api/attendance/single - Update a single student record
router.post('/single', attendanceController.updateSingleRecord);

export default router;
