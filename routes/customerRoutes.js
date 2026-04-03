const express = require('express');
const router = express.Router();
const { registerCustomer, loginCustomer, getCustomerProfile, updateCustomerProfile } = require('../controllers/authController');
const { customerAuth } = require('../middleware/authMiddleware');

// Customer public endpoints
router.post('/register', registerCustomer);
router.post('/login', loginCustomer);

// Customer protected endpoints
router.get('/profile', customerAuth, getCustomerProfile);
router.put('/profile', customerAuth, updateCustomerProfile);

module.exports = router;
