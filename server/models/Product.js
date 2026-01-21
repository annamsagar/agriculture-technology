const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide product name'],
        trim: true
    },
    category: {
        type: String,
        enum: ['vegetables', 'fruits', 'grains'],
        required: [true, 'Please specify category']
    },
    farmerPrice: {
        type: Number,
        required: [true, 'Please provide farmer price']
    },
    marketPrice: {
        type: Number,
        required: [true, 'Please provide market price']
    },
    farmerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    farmerName: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: [true, 'Please provide location']
    },
    stock: {
        type: Number,
        required: [true, 'Please provide stock quantity'],
        min: 0
    },
    availability: {
        type: String,
        enum: ['available', 'limited', 'out-of-stock'],
        default: function () {
            if (this.stock === 0) return 'out-of-stock';
            if (this.stock < 10) return 'limited';
            return 'available';
        }
    },
    image: {
        type: String,
        default: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500'
    },
    description: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Virtual for savings
productSchema.virtual('savings').get(function () {
    return this.marketPrice - this.farmerPrice;
});

// Virtual for savings percentage
productSchema.virtual('savingsPercent').get(function () {
    return Math.round(((this.marketPrice - this.farmerPrice) / this.marketPrice) * 100);
});

// Update availability based on stock
productSchema.pre('save', function (next) {
    if (this.stock === 0) {
        this.availability = 'out-of-stock';
    } else if (this.stock < 10) {
        this.availability = 'limited';
    } else {
        this.availability = 'available';
    }
    next();
});

module.exports = mongoose.model('Product', productSchema);
