const express = require('express');
const router = express.Router();
const { 
    registerAdmin, 
    loginAdmin, 
    registerCustomer,
    loginCustomer,
    getCustomerProfile,
    updateCustomerProfile
} = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Admin Routes
router.post('/admin/register', registerAdmin);
router.post('/admin/login', loginAdmin);

// Customer Routes
router.post('/customer/register', registerCustomer);
router.post('/customer/login', loginCustomer);
router.get('/customer/profile', authMiddleware, getCustomerProfile);
router.put('/customer/profile', authMiddleware, updateCustomerProfile);

// Alias routes for frontend convenience (same as customer routes)
router.post('/register', registerCustomer);          // Alias for /customer/register
router.post('/login', loginCustomer);                // Alias for /customer/login
router.get('/profile', authMiddleware, getCustomerProfile);  // Alias for /customer/profile
router.put('/profile', authMiddleware, updateCustomerProfile); // Alias for /customer/profile

module.exports = router;
