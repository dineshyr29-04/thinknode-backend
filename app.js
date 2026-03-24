const express = require('express');
const cors = require('cors');
const path = require('path');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const logger = require('./utils/logger');

const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

// Allowed Front-end Origins
const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:3000',
    process.env.ADMIN_URL || 'http://localhost:3001',
    'http://localhost:5173',  // Vite dev server default
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
];

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl requests)
        if (!origin) {
            logger.info('Request with no origin allowed (mobile/curl)');
            return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) !== -1) {
            logger.info(`CORS allowed for origin: ${origin}`);
            return callback(null, true);
        }

        // Log rejected origins for debugging
        logger.warn(`CORS BLOCKED - Origin not allowed: ${origin}`);
        logger.warn(`Allowed origins: ${allowedOrigins.join(', ')}`);
        
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true, // Important for cookies/authorization headers
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder for file uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/orders', orderRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
