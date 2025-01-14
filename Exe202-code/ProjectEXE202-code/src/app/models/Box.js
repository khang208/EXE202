const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');
const mongooseDelete = require('mongoose-delete');
// const AutoIncrement = require('mongoose-sequence')(mongoose);

const Box = new Schema(
    {
        name: { type: String, require: true },
        description: { type: String },
        image: { type: String, maxLength: 255 },
        quantity: { type: Number, require: true },
        price: { type: String, required: true },
        special: { type: Boolean, default: false },
        oderCode: { type: String },
        slug: { type: String, slug: 'name', unique: true },
    },
    {
        timestamps: true,
    },
);

// add plugin
mongoose.plugin(slug);

// Box.plugin(AutoIncrement);
Box.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
    indexFields: 'all',
});

module.exports = mongoose.model('Box', Box);
