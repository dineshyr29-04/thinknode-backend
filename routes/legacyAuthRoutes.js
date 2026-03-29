const express = require('express');
const router = express.Router();
const { registerCustomer, loginCustomer } = require('../controllers/authController');

// Legacy compatibility endpoints: map old client paths to new customer handlers
router.post('/signup', registerCustomer);
router.post('/signin', loginCustomer);
router.post('/signup/', registerCustomer);
router.post('/signin/', loginCustomer);

module.exports = router;
