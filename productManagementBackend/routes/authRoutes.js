import express from 'express';
import { login, logout, getMe, protect } from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

export default router;


