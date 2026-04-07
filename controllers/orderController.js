const Order = require('../models/orderModel');
const orderService = require('../services/orderService');
const logger = require('../utils/logger');

const createOrder = async (req, res, next) => {
    try {
        const orderData = {
            ...req.body,
            // Link to authenticated user if present
            customer_id: req.user?.id || null,
            fileDetails: req.files || [],
            files: req.files ? req.files.map(f => f.path) : req.body.files
        };

        // Ensure we have a customer name to satisfy DB NOT NULL constraint.
        const inferredName = req.user?.username || req.user?.full_name || req.body.customer_name || 'Anonymous';
        if (!orderData.customer_name) {
            orderData.customer_name = inferredName;
        }

        // Validate required fields
        if (!orderData.service_type) {
            res.status(400);
            throw new Error('Service type is required');
        }

        if (typeof orderData.customization === 'string') {
            try {
                orderData.customization = JSON.parse(orderData.customization);
            } catch (err) {
                // proceed as string if invalid JSON
            }
        }

        const orderId = await orderService.processOrderCreation(orderData);
        const createdOrder = await Order.findById(orderId);

        // Fetch related DB records for files
        createdOrder.file_details = await Order.getFilesByOrderId(orderId);

        res.status(201).json({
            success: true,
            data: createdOrder
        });
    } catch (error) {
        next(error);
    }
};

const getOrders = async (req, res, next) => {
    try {
        const orders = await Order.findAll();
        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        next(error);
    }
};

const getMyOrders = async (req, res, next) => {
    try {
        const customerId = req.user?.id;
        if (!customerId) {
            res.status(401);
            throw new Error('Not authorized, no user ID found');
        }

        const orders = await Order.findByCustomerId(customerId);
        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        next(error);
    }
};

const getOrderById = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            res.status(404);
            throw new Error('Order not found');
        }

        // Security check: Only Admn or the owner can see the order
        // Admin middleware handles the route, but if it's a shared controller:
        if (req.user && order.customer_id !== req.user.id) {
            res.status(403);
            throw new Error('Not authorized to access this order');
        }

        order.file_details = await Order.getFilesByOrderId(req.params.id);
        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

const updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!status) {
            res.status(400);
            throw new Error('Status is required');
        }

        const success = await orderService.processOrderStatusUpdate(req.params.id, status);

        if (success) {
            const updatedOrder = await Order.findById(req.params.id);
            res.json({
                success: true,
                message: 'Order status updated',
                data: updatedOrder
            });
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
            res.json({ 
                success: true,
                message: 'Order removed' 
            });
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
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    deleteOrder
};
