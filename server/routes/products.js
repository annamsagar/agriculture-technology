const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/products
// @desc    Get all products with optional filters
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { category, search, farmerId } = req.query;
        let query = {};

        if (category && category !== 'all') {
            query.category = category;
        }

        if (farmerId) {
            query.farmerId = farmerId;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { farmerName: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }

        const products = await Product.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Farmer only)
router.post('/', protect, authorize('farmer'), async (req, res) => {
    try {
        const productData = {
            ...req.body,
            farmerId: req.user.id,
            farmerName: req.user.name,
            location: req.user.farmLocation
        };

        const product = await Product.create(productData);

        res.status(201).json({
            success: true,
            product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Farmer only - own products)
router.put('/:id', protect, authorize('farmer'), async (req, res) => {
    try {
        let product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Make sure user owns the product
        if (product.farmerId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this product'
            });
        }

        product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @route   PATCH /api/products/:id/stock
// @desc    Update product stock
// @access  Private (Farmer only - own products)
router.patch('/:id/stock', protect, authorize('farmer'), async (req, res) => {
    try {
        let product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Make sure user owns the product
        if (product.farmerId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this product'
            });
        }

        product.stock = req.body.stock;
        await product.save();

        res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Farmer only - own products)
router.delete('/:id', protect, authorize('farmer'), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Make sure user owns the product
        if (product.farmerId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this product'
            });
        }

        await product.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
