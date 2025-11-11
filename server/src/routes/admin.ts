import { Router } from 'express';
import { adminLogin, getCurrentAdmin, getUsers, verifyAdminToken } from '../controllers/adminController';

const router = Router();

// Public routes
router.post('/login', adminLogin);

// Protected routes (require admin authentication)
router.get('/me', verifyAdminToken, getCurrentAdmin);
router.get('/users', verifyAdminToken, getUsers);

export default router;
