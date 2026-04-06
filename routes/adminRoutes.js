const express = require('express');
const router = express.Router();
const { registerAdmin, loginAdmin, getAdminProfile } = require('../controllers/authController');
const { adminAuth } = require('../middleware/authMiddleware');

// Admin public endpoints
router.post('/register', registerAdmin);
// alias for frontend: /signup
router.post('/signup', registerAdmin);
router.post('/login', loginAdmin);

// Admin protected endpoints
router.get('/profile', adminAuth, getAdminProfile);

module.exports = router;
