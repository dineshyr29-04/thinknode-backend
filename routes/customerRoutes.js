const express = require('express');
const router = express.Router();
const { registerCustomer, loginCustomer, getCustomerProfile, updateCustomerProfile } = require('../controllers/authController');
const { createOrder, getMyOrders } = require('../controllers/orderController');
const { customerAuth } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

// Customer public endpoints
router.post('/register', registerCustomer);
router.post('/login', loginCustomer);

// Customer protected profile endpoints
router.get('/profile', customerAuth, getCustomerProfile);
router.put('/profile', customerAuth, updateCustomerProfile);

// Customer protected order endpoints
// This consolidates order actions into the customer routes
router.post('/orders', customerAuth, upload.array('files', 5), createOrder);
router.get('/my-orders', customerAuth, getMyOrders);

module.exports = router;
