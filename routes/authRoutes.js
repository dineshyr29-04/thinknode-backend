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

module.exports = router;
