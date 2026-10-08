import { Router } from 'express';
import { authController } from '../controllers/authController.js';

const router = Router();

router.post('/student-login', authController.studentLogin);
router.post('/professor-login', authController.professorLogin);
router.post('/google-login', authController.googleLogin);
router.get('/me', authController.getSessionProfile);

export default router;
