module.exports = {
    mutipleMongoose: function (mongooses) {
        return mongooses.map((mongoose) => mongoose.toObject());
    },

    simpleMongoose: function (mongoose) {
        return mongoose ? mongoose.toObject() : mongoose;
    },
};
