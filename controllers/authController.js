const Admin = require('../models/adminModel');
const Customer = require('../models/customerModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { getIO } = require('../config/socket');

const generateToken = (id, username, role = 'admin') => {
    return jwt.sign({ id, username, role }, process.env.JWT_SECRET || 'thinknode_secret', {
        expiresIn: '30d',
    });
};

// ========== ADMIN FUNCTIONS ==========

const registerAdmin = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        const adminExists = await Admin.findByUsername(username);

        if (adminExists) {
            res.status(400);
            throw new Error('Admin username already exists');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const adminId = await Admin.create({
            username,
            email,
            password: hashedPassword
        });

        if (adminId) {
            res.status(201).json({
                id: adminId,
                username: username,
                email: email,
                token: generateToken(adminId, username, 'admin'),
            });
        } else {
            res.status(400);
            throw new Error('Invalid admin data');
        }
    } catch (error) {
        next(error);
    }
};

const loginAdmin = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        const admin = await Admin.findByUsername(username);

        if (admin && (await bcrypt.compare(password, admin.password))) {
            res.json({
                id: admin.id,
                username: admin.username,
                email: admin.email,
                token: generateToken(admin.id, admin.username, 'admin'),
            });
        } else {
            res.status(401);
            throw new Error('Invalid username or password');
        }
    } catch (error) {
        next(error);
    }
};

// ========== CUSTOMER FUNCTIONS ==========

const registerCustomer = async (req, res, next) => {
    try {
        const { username, email, password, full_name, phone, company_name } = req.body;

        // Validation
        if (!username || !email || !password) {
            res.status(400);
            throw new Error('Please provide username, email, and password');
        }

        // Check if customer already exists
        const emailExists = await Customer.findByEmail(email);
        if (emailExists) {
            res.status(400);
            throw new Error('Email already registered');
        }

        const usernameExists = await Customer.findByUsername(username);
        if (usernameExists) {
            res.status(400);
            throw new Error('Username already taken');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create customer
        const customer = await Customer.create({
            username,
            email,
            password: hashedPassword,
            full_name: full_name || '',
            phone: phone || '',
            company_name: company_name || ''
        });

        if (customer) {
            const token = generateToken(customer.id, customer.username, 'customer');

            // Emit registration event via Socket.io
            try {
                const io = getIO();
                io.emit('customer:registered', {
                    id: customer.id,
                    username: customer.username,
                    email: customer.email,
                    full_name: customer.full_name,
                    timestamp: new Date()
                });
                logger.info(`New customer registered: ${customer.username}`);
            } catch (ioError) {
                logger.error('Socket.io emit error:', ioError);
            }

            res.status(201).json({
                success: true,
                message: 'Customer registered successfully',
                data: {
                    id: customer.id,
                    username: customer.username,
                    email: customer.email,
                    full_name: customer.full_name,
                    phone: customer.phone,
                    company_name: customer.company_name,
                    token: token,
                }
            });
        } else {
            res.status(400);
            throw new Error('Invalid customer data');
        }
    } catch (error) {
        next(error);
    }
};

const loginCustomer = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400);
            throw new Error('Please provide email and password');
        }

        const customer = await Customer.findByEmail(email);

        if (customer && (await bcrypt.compare(password, customer.password))) {
            const token = generateToken(customer.id, customer.username, 'customer');

            // Emit login event via Socket.io
            try {
                const io = getIO();
                io.emit('customer:loggedIn', {
                    id: customer.id,
                    username: customer.username,
                    timestamp: new Date()
                });
            } catch (ioError) {
                logger.error('Socket.io emit error:', ioError);
            }

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    id: customer.id,
                    username: customer.username,
                    email: customer.email,
                    full_name: customer.full_name,
                    phone: customer.phone,
                    company_name: customer.company_name,
                    token: token,
                }
            });
        } else {
            res.status(401);
            throw new Error('Invalid email or password');
        }
    } catch (error) {
        next(error);
    }
};

const getCustomerProfile = async (req, res, next) => {
    try {
        const customerId = req.user?.id;

        if (!customerId) {
            res.status(401);
            throw new Error('Unauthorized - Please login');
        }

        const customer = await Customer.findById(customerId);

        if (!customer) {
            res.status(404);
            throw new Error('Customer not found');
        }

        res.json({
            success: true,
            data: customer
        });
    } catch (error) {
        next(error);
    }
};

const updateCustomerProfile = async (req, res, next) => {
    try {
        const customerId = req.user?.id;

        if (!customerId) {
            res.status(401);
            throw new Error('Unauthorized - Please login');
        }

        const updatedCustomer = await Customer.updateProfile(customerId, req.body);

        if (!updatedCustomer) {
            res.status(404);
            throw new Error('Customer not found');
        }

        // Emit profile update event via Socket.io
        try {
            const io = getIO();
            io.emit('customer:profileUpdated', {
                id: updatedCustomer.id,
                username: updatedCustomer.username,
                timestamp: new Date()
            });
        } catch (ioError) {
            logger.error('Socket.io emit error:', ioError);
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedCustomer
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    registerAdmin,
    loginAdmin,
    registerCustomer,
    loginCustomer,
    getCustomerProfile,
    updateCustomerProfile
};
