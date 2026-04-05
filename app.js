const express = require('express');
const cors = require('cors');
const path = require('path');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const logger = require('./utils/logger');

const adminRoutes = require('./routes/adminRoutes');
const customerRoutes = require('./routes/customerRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

// Simple request logger to surface incoming requests (helps diagnose deployed timeouts)
app.use((req, res, next) => {
    try {
        logger.info(`[REQUEST] ${req.method} ${req.originalUrl} from ${req.ip}`);
    } catch (e) {
        // don't let logging break requests
        console.error('Logger failed', e);
    }
    next();
});

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Access-Control-Allow-Private-Network');
    
    // Handle Private Network Access (PNA) checks from browsers like Chrome
    res.setHeader('Access-Control-Allow-Private-Network', 'true');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder for file uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/customer', customerRoutes);

app.use('/api/services', serviceRoutes);
app.use('/api/upload', orderRoutes);

// Health check for quick remote connectivity tests
app.get('/health', (req, res) => res.status(200).send('ok'));

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
