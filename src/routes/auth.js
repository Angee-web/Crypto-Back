import express from 'express';
import { 
  register, 
  login, 
  getProfile,
  resetPassword,
  forgotPassword,
  logout
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { loginValidation, registerValidation } from '../validations/validations.js';

const router = express.Router();

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/logout', logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes
router.get('/profile', protect, getProfile);

export default router;