const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');
const mongooseDelete = require('mongoose-delete');
// const AutoIncrement = require('mongoose-sequence')(mongoose);

const Order = new Schema(
    {
        name: { type: String, require: true },
        phone: { type: String },
        address: { type: String, maxLength: 255 },
        email: { type: String, require: true },
        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                },
                comboId: { type: mongoose.Schema.Types.ObjectId, ref: 'Combo' },
                quantity: { type: Number, default: 1 },
                name: { type: String, require: true },
                price: { type: String },
                oderCode: { type: String },
            },
        ],
        slug: { type: String, slug: 'name', unique: true },
    },
    {
        timestamps: true,
    },
);

// add plugin
mongoose.plugin(slug);

// Order.plugin(AutoIncrement);
Order.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
    indexFields: 'all',
});

module.exports = mongoose.model('Order', Order);
