const Admin = require('../models/adminModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const generateToken = (id, username) => {
    return jwt.sign({ id, username }, process.env.JWT_SECRET || 'thinknode_secret', {
        expiresIn: '30d',
    });
};

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
                token: generateToken(adminId, username),
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
                token: generateToken(admin.id, admin.username),
            });
        } else {
            res.status(401);
            throw new Error('Invalid username or password');
        }
    } catch (error) {
        next(error);
    }
};

module.exports = {
    registerAdmin,
    loginAdmin
};
