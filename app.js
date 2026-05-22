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
// Whitelist CORS: build from env vars (so changing .env updates CORS) with sensible defaults
const clientUrl = process.env.CLIENT_URL || 'https://thinknode-customer.vercel.app';
const adminUrl = process.env.ADMIN_URL || 'https://thinknode-admin.vercel.app';
const allowedOrigins = [
    clientUrl,
    adminUrl,
    'http://localhost:5173',
    'http://localhost:5174'
];

app.use((req, res, next) => {
    const corsOptions = {
        origin: (originValue, callback) => {
            if (!originValue) return callback(null, true); // allow non-browser or same-origin requests
            if (allowedOrigins.includes(originValue)) return callback(null, true);
            return callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Private-Network'],
        exposedHeaders: ['Access-Control-Allow-Private-Network']
    };

    return cors(corsOptions)(req, res, next);
});
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

// Root route for Render or simple browser checks
app.get('/', (req, res) => res.status(200).json({ success: true, message: 'API running' }));

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
