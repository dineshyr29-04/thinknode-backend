const Admin = require('../models/adminModel');
const Customer = require('../models/customerModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { getIO } = require('../config/socket');
    try {
        // Accept flexible field names from frontend (username or name or fullName)
        const body = req.body || {};
        const username = body.username || body.name || body.full_name || body.fullName;
        const email = body.email || body.mail;
        const password = body.password || body.pass;
        const full_name = body.full_name || body.fullName || body.name || null;
        const phone = body.phone || body.phoneNumber || body.mobile || null;
        const company_name = body.company_name || body.company || body.companyName || null;

        logger.info('🔄 REGISTRATION STARTED');
        logger.info(`📦 Full request body: ${JSON.stringify(body)}`);
        logger.info(`📝 Mapped: username=${username || 'undefined'}, email=${email || 'undefined'}, password=${password ? '***' : 'MISSING'}`);

        // Validation
        if (!username || !email || !password) {
            logger.error('❌ VALIDATION FAILED - Missing required fields');
            logger.error(`📦 Received body: ${JSON.stringify(body)}`);
            logger.error(`Mapped variables: username="${username}", email="${email}", password="${password ? '***' : 'MISSING'}"`);
            res.status(400);
            throw new Error('Please provide username, email, and password');
        }
        logger.info('✅ Validation passed: All required fields provided');
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

        logger.info('🔄 REGISTRATION STARTED');
        logger.info(`� Full request body: ${JSON.stringify(req.body)}`);
        logger.info(`📝 Extracted: username=${username}, email=${email}, password=${password ? '***' : 'MISSING'}`);

        // Validation
        if (!username || !email || !password) {
            logger.error('❌ VALIDATION FAILED - Missing fields!');
            logger.error(`📦 Received body: ${JSON.stringify(req.body)}`);
            logger.error(`Variables: username="${username}", email="${email}", password="${password}"`);
            res.status(400);
            throw new Error('Please provide username, email, and password');
        }
        logger.info('✅ Validation passed: All required fields provided');

        // Check if customer already exists
        logger.info('🔍 Checking if email already exists...');
        const emailExists = await Customer.findByEmail(email);
        if (emailExists) {
            logger.warn(`❌ Email already registered: ${email}`);
            res.status(400);
            throw new Error('Email already registered');
        }
        logger.info('✅ Email is unique');

        logger.info('🔍 Checking if username already exists...');
        const usernameExists = await Customer.findByUsername(username);
        if (usernameExists) {
            logger.warn(`❌ Username already taken: ${username}`);
            res.status(400);
            throw new Error('Username already taken');
        }
        logger.info('✅ Username is unique');

        // Hash password
        logger.info('🔐 Hashing password...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        logger.info('✅ Password hashed successfully');

        // Create customer
        logger.info('💾 Creating customer in database...');
        const customer = await Customer.create({
            username,
            email,
            password: hashedPassword,
            full_name: full_name || '',
            phone: phone || '',
            company_name: company_name || ''
        });

        if (customer) {
            logger.info(`✅ CUSTOMER CREATED IN DATABASE`);
            logger.info(`📌 Customer ID: ${customer.id}`);
            logger.info(`👤 Username: ${customer.username}`);
            logger.info(`📧 Email: ${customer.email}`);
            
            const token = generateToken(customer.id, customer.username, 'customer');
            logger.info('🔑 JWT Token generated (expires in 30 days)');

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
                logger.info('📡 Socket.io event emitted: customer:registered');
            } catch (ioError) {
                logger.error('⚠️ Socket.io emit error:', ioError);
            }

            logger.info('');
            logger.info('════════════════════════════════════════');
            logger.info('🎉 REGISTRATION SUCCESSFUL!');
            logger.info('════════════════════════════════════════');
            logger.info(`Customer ${username} has been registered`);
            logger.info(`Check database or use: SELECT * FROM customers WHERE id = ${customer.id}`);
            logger.info('════════════════════════════════════════');
            logger.info('');

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
            logger.error('❌ Failed to create customer - no data returned');
            res.status(400);
            throw new Error('Invalid customer data');
        }
    } catch (error) {
        logger.error(`❌ REGISTRATION ERROR: ${error.message}`);
        next(error);
    }
};

const loginCustomer = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        logger.info('🔄 LOGIN STARTED');
        logger.info(`📧 Email: ${email}`);

        if (!email || !password) {
            logger.warn('❌ Validation failed: Missing email or password');
            res.status(400);
            throw new Error('Please provide email and password');
        }
        logger.info('✅ Validation passed');

        logger.info('🔍 Looking up customer by email...');
        const customer = await Customer.findByEmail(email);

        if (!customer) {
            logger.warn(`❌ Customer not found: ${email}`);
            res.status(401);
            throw new Error('Invalid email or password');
        }
        logger.info(`✅ Customer found: ${customer.username}`);

        logger.info('🔐 Verifying password...');
        const passwordMatch = await bcrypt.compare(password, customer.password);
        
        if (passwordMatch) {
            logger.info('✅ Password verified!');
            const token = generateToken(customer.id, customer.username, 'customer');
            logger.info('🔑 JWT Token generated');

            // Emit login event via Socket.io
            try {
                const io = getIO();
                io.emit('customer:loggedIn', {
                    id: customer.id,
                    username: customer.username,
                    timestamp: new Date()
                });
                logger.info('📡 Socket.io event emitted: customer:loggedIn');
            } catch (ioError) {
                logger.error('⚠️ Socket.io emit error:', ioError);
            }

            logger.info('');
            logger.info('════════════════════════════════════════');
            logger.info('🎉 LOGIN SUCCESSFUL!');
            logger.info('════════════════════════════════════════');
            logger.info(`Customer: ${customer.username} (ID: ${customer.id})`);
            logger.info('════════════════════════════════════════');
            logger.info('');

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
            logger.warn(`❌ Password verification failed for: ${email}`);
            res.status(401);
            throw new Error('Invalid email or password');
        }
    } catch (error) {
        logger.error(`❌ LOGIN ERROR: ${error.message}`);
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
