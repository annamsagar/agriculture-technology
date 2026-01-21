const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true,
        required: true
    },
    buyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    buyerName: {
        type: String,
        required: true
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        productName: String,
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        },
        farmerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        farmerName: String
    }],
    total: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    deliveryDate: {
        type: Date
    }
}, {
    timestamps: true
});

// Generate order ID before saving
orderSchema.pre('save', async function (next) {
    if (!this.orderId) {
        const count = await mongoose.model('Order').countDocuments();
        this.orderId = `ORD-${String(count + 1001).padStart(4, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);
