import { Router } from 'express';
import { reportController } from '../controllers/reportController.js';

const router = Router();

// GET /api/reports/unified - Get unified attendance report (Lecture vs Lab vs Overall)
router.get('/unified', reportController.getUnifiedReport);

// GET /api/reports/student/:studentId - Detailed student report (monthly & semester)
router.get('/student/:studentId', reportController.getStudentDetailedReport);

export default router;
