const Order = require('../models/orderModel');
const socket = require('../config/socket');
const pool = require('../config/database');
const logger = require('../utils/logger');

const processOrderCreation = async (orderData) => {
    try {
        const orderId = await Order.create(orderData);

        // Save files if they exist
        if (orderData.fileDetails && orderData.fileDetails.length > 0) {
            for (const file of orderData.fileDetails) {
                await Order.addFileRecord(orderId, file.path, file.originalname);
            }
        }

        // Create new notification for dashboard
        const [result] = await pool.query(
            'INSERT INTO notifications (type, message) VALUES (?, ?)',
            ['new_order', `New order #${orderId} received from ${orderData.customer_name}`]
        );

        // Fetch the inserted notification
        const [notifications] = await pool.query('SELECT * FROM notifications WHERE id = ?', [result.insertId]);
        const notification = notifications[0];

        // Emit socket events
        try {
            const io = socket.getIO();
            const orderConfig = await Order.findById(orderId);
            io.emit('new-order', orderConfig);
            io.emit('notification', notification);
        } catch (socketErr) {
            logger.error('Failed to emit socket event', socketErr);
        }

        return orderId;
    } catch (error) {
        logger.error('Error creating order in service', error);
        throw error;
    }
};

const processOrderStatusUpdate = async (id, status) => {
    try {
        const affectedRows = await Order.updateStatus(id, status);
        if (affectedRows === 0) return false;

        // Create notification
        const [result] = await pool.query(
            'INSERT INTO notifications (type, message) VALUES (?, ?)',
            ['status_update', `Order #${id} status changed to ${status}`]
        );

        const [notifications] = await pool.query('SELECT * FROM notifications WHERE id = ?', [result.insertId]);
        const notification = notifications[0];

        try {
            const io = socket.getIO();
            const orderConfig = await Order.findById(id);
            io.emit('order-updated', orderConfig);
            io.emit('notification', notification);
        } catch (socketErr) {
            logger.error('Failed to emit socket event', socketErr);
        }

        return true;
    } catch (error) {
        logger.error('Error updating order status in service', error);
        throw error;
    }
};

module.exports = {
    processOrderCreation,
    processOrderStatusUpdate
};
