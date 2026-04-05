const Order = require('../models/orderModel');
const socket = require('../config/socket');
const pool = require('../config/database');
const logger = require('../utils/logger');
const axios = require('axios');

const processOrderCreation = async (orderData) => {
    try {
        const orderId = await Order.create(orderData);

        // Save files if they exist
        if (orderData.fileDetails && orderData.fileDetails.length > 0) {
            for (const file of orderData.fileDetails) {
                await Order.addFileRecord(orderId, file.path, file.originalname);
            }
        }

        // Create new notification for dashboard (Postgres)
        const notifResult = await pool.query(
            'INSERT INTO notifications (type, message) VALUES ($1, $2) RETURNING *',
            ['new_order', `New order #${orderId} received from ${orderData.customer_name}`]
        );
        const notification = notifResult.rows[0];

        // Emit socket events
        try {
            const io = socket.getIO();
            const orderConfig = await Order.findById(orderId);

            // Detailed logging before sending
            logger.info(`Emitting new-order socket event for order ${orderId}`);
            logger.info(`Order payload summary: customer_name=${orderConfig.customer_name}, email=${orderConfig.email}, service_type=${orderConfig.service_type}, project_title=${orderConfig.project_title}`);

            // Emit socket events to connected clients (admins/frontends)
            io.emit('new-order', orderConfig);
            io.emit('notification', notification);
            logger.info(`Socket events emitted for order ${orderId}`);

            // Also POST the order data to a configured admin webhook if present.
            // Support optional headers via ADMIN_WEBHOOK_HEADERS env var (JSON string).
            const adminWebhook = process.env.ADMIN_WEBHOOK_URL;
            if (adminWebhook) {
                let webhookHeaders = {};
                try {
                    if (process.env.ADMIN_WEBHOOK_HEADERS) {
                        webhookHeaders = JSON.parse(process.env.ADMIN_WEBHOOK_HEADERS);
                    }
                } catch (hdrErr) {
                    logger.warn('Invalid ADMIN_WEBHOOK_HEADERS JSON, ignoring headers');
                }

                const axiosConfig = { timeout: 5000, headers: webhookHeaders };

                // Log attempt (do not log sensitive header values)
                const safeHeadersLog = Object.keys(webhookHeaders).map(k => `${k}=***`).join(', ');
                logger.info(`Posting order ${orderId} to admin webhook ${adminWebhook} with headers: ${safeHeadersLog || 'none'}`);

                // Do a single attempt but log response or error
                axios.post(adminWebhook, orderConfig, axiosConfig)
                    .then((resp) => {
                        logger.info(`Admin webhook responded with status ${resp.status} for order ${orderId}`);
                    })
                    .catch((webErr) => {
                        logger.error(`Failed posting order ${orderId} to admin webhook`, webErr && webErr.message ? webErr.message : webErr);
                    });
            }
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
        const notifResult = await pool.query(
            'INSERT INTO notifications (type, message) VALUES ($1, $2) RETURNING *',
            ['status_update', `Order #${id} status changed to ${status}`]
        );
        const notification = notifResult.rows[0];

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
