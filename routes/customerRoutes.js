const express = require('express');
const router = express.Router();
const { registerCustomer, loginCustomer, getCustomerProfile, updateCustomerProfile } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Customer public endpoints
router.post('/register', registerCustomer);
router.post('/login', loginCustomer);

// Customer protected endpoints
router.get('/profile', authMiddleware, getCustomerProfile);
router.put('/profile', authMiddleware, updateCustomerProfile);

module.exports = router;
