const Order = require('../models/orderModel');
const orderService = require('../services/orderService');

const createOrder = async (req, res, next) => {
    try {
        const orderData = {
            ...req.body,
            fileDetails: req.files || [],
            // For compatibility if they send JSON stringified files in body instead of actual files,
            // handled by our service that saves file records. I'll pass simple file metadata if we have multer files:
            files: req.files ? req.files.map(f => f.path) : req.body.files
        };

        if (typeof orderData.customization === 'string') {
            try {
                orderData.customization = JSON.parse(orderData.customization);
            } catch (err) {
                // Ignored, proceed as string if invalid JSON
            }
        }

        const orderId = await orderService.processOrderCreation(orderData);
        const createdOrder = await Order.findById(orderId);

        // Fetch related DB records for files
        createdOrder.file_details = await Order.getFilesByOrderId(orderId);

        res.status(201).json(createdOrder);
    } catch (error) {
        next(error);
    }
};

const getOrders = async (req, res, next) => {
    try {
        const orders = await Order.findAll();
        res.json(orders);
    } catch (error) {
        next(error);
    }
};

const getOrderById = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);
        if (order) {
            order.file_details = await Order.getFilesByOrderId(req.params.id);
            res.json(order);
        } else {
            res.status(404);
            throw new Error('Order not found');
        }
    } catch (error) {
        next(error);
    }
};

const updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!status) {
            res.status(400);
            throw new Error('Status requires a value');
        }

        const success = await orderService.processOrderStatusUpdate(req.params.id, status);

        if (success) {
            const updatedOrder = await Order.findById(req.params.id);
            res.json(updatedOrder);
        } else {
            res.status(404);
            throw new Error('Order not found');
        }
    } catch (error) {
        next(error);
    }
};

const deleteOrder = async (req, res, next) => {
    try {
        const affectedRows = await Order.delete(req.params.id);
        if (affectedRows) {
            res.json({ message: 'Order removed' });
        } else {
            res.status(404);
            throw new Error('Order not found');
        }
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    deleteOrder
};
