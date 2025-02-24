const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');
const mongooseDelete = require('mongoose-delete');
// const AutoIncrement = require('mongoose-sequence')(mongoose);

const News = new Schema(
    {
        _id: { type: Number },
        name: { type: String, require: true },
        description: { type: String },
        image: { type: String, maxLength: 255 },
        videoID: { type: String, require: true },
        level: { type: String, maxLength: 255 },
        price: { type: String, maxLength: 255 },
        slug: { type: String, slug: 'name', unique: true },
    },
    {
        _id: false,
        timestamps: true,
    },
);

// add plugin
mongoose.plugin(slug);

// News.plugin(AutoIncrement);
News.plugin(mongooseDelete, {
    overrideMethods: 'all',
    deletedAt: true,
    indexFields: 'all',
});

module.exports = mongoose.model('News', News);
