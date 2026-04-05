const express = require('express');
const router = express.Router();
const { registerCustomer, loginCustomer, getCustomerProfile, updateCustomerProfile } = require('../controllers/authController');
const { createOrder } = require('../controllers/orderController');
const { customerAuth } = require('../middleware/authMiddleware');

// Customer public endpoints
router.post('/register', registerCustomer);
router.post('/login', loginCustomer);

// Customer can create orders at /api/customer/orders (protected)
router.post('/orders', customerAuth, createOrder);

// Customer protected endpoints
router.get('/profile', customerAuth, getCustomerProfile);
router.put('/profile', customerAuth, updateCustomerProfile);

module.exports = router;
