const express = require('express');
const router = express.Router();
const { registerAdmin, loginAdmin, getAdminProfile } = require('../controllers/authController');
const { getOrders, getOrderById, updateOrderStatus, deleteOrder } = require('../controllers/orderController');
const { adminAuth } = require('../middleware/authMiddleware');

// Admin public endpoints
router.post('/register', registerAdmin);
router.post('/signup', registerAdmin);
router.post('/login', loginAdmin);

// Admin protected profile
router.get('/profile', adminAuth, getAdminProfile);

// Admin protected order management
router.get('/orders', adminAuth, getOrders);
router.get('/orders/:id', adminAuth, getOrderById);
router.patch('/orders/:id/status', adminAuth, updateOrderStatus);
router.delete('/orders/:id', adminAuth, deleteOrder);

module.exports = router;
