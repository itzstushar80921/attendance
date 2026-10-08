import { Router } from 'express';
import { sessionController } from '../controllers/sessionController.js';

const router = Router();

// GET /api/sessions - List sessions (filter by class_type, course, date)
router.get('/', sessionController.getSessions);

// POST /api/sessions - Create new session (lecture or lab)
router.post('/', sessionController.createSession);

// GET /api/sessions/:id - Get session by ID with attendance records
router.get('/:id', sessionController.getSessionById);

// POST & PATCH /api/sessions/:id/cancel - Cancel class session
router.post('/:id/cancel', sessionController.cancelSession);
router.patch('/:id/cancel', sessionController.cancelSession);

// POST & PATCH /api/sessions/:id/restore - Restore cancelled class session
router.post('/:id/restore', sessionController.restoreSession);
router.patch('/:id/restore', sessionController.restoreSession);

// DELETE /api/sessions/:id - Delete session and records
router.delete('/:id', sessionController.deleteSession);

export default router;
