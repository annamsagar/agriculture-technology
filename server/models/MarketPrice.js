const mongoose = require('mongoose');

const marketPriceSchema = new mongoose.Schema({
    commodity: {
        type: String,
        required: true,
        unique: true
    },
    marketPrice: {
        type: Number,
        required: true
    },
    farmerPrice: {
        type: Number,
        required: true
    },
    change: {
        type: Number,
        default: 0
    },
    category: {
        type: String,
        enum: ['vegetables', 'fruits', 'grains'],
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('MarketPrice', marketPriceSchema);
