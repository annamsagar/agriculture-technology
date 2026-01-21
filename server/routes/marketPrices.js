const express = require('express');
const router = express.Router();
const MarketPrice = require('../models/MarketPrice');

// @route   GET /api/market-prices
// @desc    Get all market prices
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        let query = {};

        if (category && category !== 'all') {
            query.category = category;
        }

        const prices = await MarketPrice.find(query).sort({ commodity: 1 });

        res.status(200).json({
            success: true,
            count: prices.length,
            prices
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   PUT /api/market-prices/:id
// @desc    Update market price
// @access  Public (In production, this should be admin only)
router.put('/:id', async (req, res) => {
    try {
        const price = await MarketPrice.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!price) {
            return res.status(404).json({
                success: false,
                message: 'Market price not found'
            });
        }

        res.status(200).json({
            success: true,
            price
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
