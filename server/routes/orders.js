const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/orders
// @desc    Get user orders
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};

        // Buyers see their orders, farmers see orders for their products
        if (req.user.type === 'buyer') {
            query.buyerId = req.user.id;
        } else if (req.user.type === 'farmer') {
            query['items.farmerId'] = req.user.id;
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        const orders = await Order.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check authorization
        const isAuthorized =
            order.buyerId.toString() === req.user.id ||
            order.items.some(item => item.farmerId.toString() === req.user.id);

        if (!isAuthorized) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this order'
            });
        }

        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   POST /api/orders
// @desc    Create new order
// @access  Private (Buyer only)
router.post('/', protect, authorize('buyer'), async (req, res) => {
    try {
        const { items } = req.body;

        // Validate and calculate total
        let total = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product ${item.productId} not found`
                });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}`
                });
            }

            orderItems.push({
                productId: product._id,
                productName: product.name,
                quantity: item.quantity,
                price: product.farmerPrice,
                farmerId: product.farmerId,
                farmerName: product.farmerName
            });

            total += product.farmerPrice * item.quantity;

            // Update product stock
            product.stock -= item.quantity;
            await product.save();
        }

        const order = await Order.create({
            buyerId: req.user.id,
            buyerName: req.user.name,
            items: orderItems,
            total
        });

        res.status(201).json({
            success: true,
            order
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @route   PATCH /api/orders/:id/status
// @desc    Update order status
// @access  Private
router.patch('/:id/status', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check authorization
        const isAuthorized =
            order.buyerId.toString() === req.user.id ||
            order.items.some(item => item.farmerId.toString() === req.user.id);

        if (!isAuthorized) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this order'
            });
        }

        order.status = req.body.status;

        if (req.body.status === 'delivered') {
            order.deliveryDate = new Date();
        }

        await order.save();

        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @route   DELETE /api/orders/:id
// @desc    Cancel order
// @access  Private (Buyer only - own orders)
router.delete('/:id', protect, authorize('buyer'), async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Make sure user owns the order
        if (order.buyerId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to cancel this order'
            });
        }

        // Can only cancel pending or confirmed orders
        if (!['pending', 'confirmed'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel order in current status'
            });
        }

        // Restore product stock
        for (const item of order.items) {
            const product = await Product.findById(item.productId);
            if (product) {
                product.stock += item.quantity;
                await product.save();
            }
        }

        order.status = 'cancelled';
        await order.save();

        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
