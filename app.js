const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const logger = require('./utils/logger');

const adminRoutes = require('./routes/adminRoutes');
const customerRoutes = require('./routes/customerRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

// Security Middlewares
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window`
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests from this IP, please try again after 15 minutes"
    }
});
app.use('/api/', limiter);

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

const cors = require('cors');

// Map frontend origins to their allowed API endpoint prefixes
const corsOriginMap = [
    {
        origin: 'https://thinknode-customer.vercel.app',
        pathPrefix: '/api/customer'
    },
    {
        origin: 'https://thinknode-admin.vercel.app',
        pathPrefix: '/api/admin'
    },
    {
        origin: 'http://localhost:5173',
        pathPrefix: '/api/customer'
    },
    {
        origin: 'http://localhost:5174',
        pathPrefix: '/api/admin'
    }
];

app.use(cors({
    origin: true, // Reflects the request origin, effectively allowing all
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Private-Network'],
    exposedHeaders: ['Access-Control-Allow-Private-Network']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder for file uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/customer', customerRoutes);

app.use('/api/services', serviceRoutes);

// Health check for quick remote connectivity tests
app.get('/health', (req, res) => res.status(200).send('ok'));

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
