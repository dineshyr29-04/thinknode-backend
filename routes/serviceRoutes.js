const express = require('express');
const router = express.Router();
const { getServices, createService, updateService, deleteService } = require('../controllers/serviceController');
const { adminAuth } = require('../middleware/authMiddleware');

router.route('/')
    .get(getServices)
    .post(adminAuth, createService);

router.route('/:id')
    .patch(adminAuth, updateService)
    .delete(adminAuth, deleteService);

module.exports = router;
