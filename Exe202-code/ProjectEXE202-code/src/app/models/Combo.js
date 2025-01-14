const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');
const mongooseDelete = require('mongoose-delete');

// Model Combo
const Combo = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String },
        image: { type: String, maxLength: 255 },
        price: { type: String, required: true },
        products: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                quantity: { type: Number, default: 1 },
                price: { type: String },
            },
        ], // Danh sách sản phẩm trong combo
        slug: { type: String, slug: 'name', unique: true },
    },
    {
        timestamps: true,
    },
);

// Plugins
mongoose.plugin(slug);
Combo.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
    indexFields: 'all',
});

module.exports = mongoose.model('Combo', Combo);
