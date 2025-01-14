// models/CustomBox.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const CustomBox = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true,
    },
    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            comboId: { type: mongoose.Schema.Types.ObjectId, ref: 'Combo' },
            boxId: { type: mongoose.Schema.Types.ObjectId, ref: 'Box' },
            mesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mes' },
            quantity: { type: Number, default: 0 },
            price: { type: String },
            name: { type: String },
            oderCode: { type: String, default: Math.random },
        },
    ],
    payment: { type: Boolean, default: false },
    totalQuantity: { type: Number, default: 0 }, // Tổng số sản phẩm trong giỏ
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CustomBox', CustomBox);
