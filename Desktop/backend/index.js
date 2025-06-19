const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// -------------------- Security Middleware --------------------
// HTTP headers hardening
app.use(helmet());

// CORS configuration
app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true
    })
);

// Rate-limiting for all API endpoints
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// -------------------- Body Parsing --------------------
// Raw body for webhook signature verification (must go before json parser)  
app.use('/api/kyc/webhook', express.raw({ type: 'application/json' }));

// Standard body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// -------------------- Health Check --------------------
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// -------------------- Route Imports --------------------
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');
const kycRoutes = require('./routes/kyc');
const adminClientsRouter = require('./routes/admin/clients');

// -------------------- API Routes --------------------
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin/clients', adminClientsRouter);
app.use('/api/kyc', kycRoutes);

// -------------------- 404 Handler --------------------
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

// -------------------- Global Error Handler --------------------
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
    console.error('Global Error:', error);
    res.status(error.status || 500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ?
            'Internal server error' : error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

// -------------------- Server Startup --------------------
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`🚀 Backend API running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;