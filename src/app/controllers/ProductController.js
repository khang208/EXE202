const { mutipleMongoose } = require('../../until/mongoose');
const { response } = require('express');
const Product = require('../models/Product');
const Combo = require('../models/Combo');
const getCartCount = require('../middlewares/cartCount'); // Import helper

class Productcontrollers {
    //GET /product/productShow
    show(req, res, next) {
        const userId = req.session.userId;
        getCartCount(userId)
            .then((cartCount) => {
                Product.find({})
                    .lean()
                    .then((products) => {
                        res.render('product/productShow', {
                            products,
                            cartCount,
                        });
                    })
                    .catch((error) => {
                        next(error); // Xử lý lỗi khi lấy sản phẩm
                    });
            })
            .catch((error) => {
                console.error('Error fetching cart count:', error);
                res.render('product/productShow', {
                    products: [],
                    cartCount: 0,
                });
            });
    }

    showDetail(req, res, next) {
        Product.findOne({ slug: req.params.slug })
            .lean()
            .then((product) => {
                res.render('product/show', { product });
            })
            .catch((error) => {
                next(error);
            });
    }
    ShowDetailCombo(req, res, next) {
        Product.findOne({ slug: req.params.slug })
            .lean()
            .then((combo) => {
                res.render('product/show', { combo });
            })
            .catch((error) => {
                next(error);
            });
    }
    showCombo(req, res) {
        const userId = req.session.userId;
        getCartCount(userId)
            .then((cartCount) => {
                Combo.find({})
                    .lean()
                    .then((combos) => {
                        res.render('product/productCombo', {
                            combos,
                            cartCount,
                        });
                    })
                    .catch((error) => {
                        next(error);
                    });
            })
            .catch((error) => {
                console.error('Error fetching cart count:', error);
                res.render('product/productCombo', {
                    products: [],
                    cartCount: 0,
                });
            });
    }
    // //GET /stored/courses
    // storedCourses(req, res, next) {
    //   let courseFind =Course.find({}).lean();
    //   if(req.query.hasOwnProperty('_sort')){
    //     courseFind= courseFind.sort({
    //       [req.query.column]: req.query.type
    //     });
    //   }
    //   Promise.all([courseFind, Course.countDocumentsDeleted({delete: true})])
    //     .then(([courses, deleteCount]) => {
    //       res.render("me/stored-Courses", { courses, deleteCount });
    //     })
    //     .catch(next);
    // }

    // //GET /trash/courses

    // trash(req, res, next) {
    //   Course.findDeleted({})
    //     .then((courses) => res.render("me/trash-Courses", { courses: mutipleMongoose(courses) }))
    //     .catch(next);
    // }
}

module.exports = new Productcontrollers();
