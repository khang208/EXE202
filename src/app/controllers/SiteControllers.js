const Product = require('../models/Product');
const New = require('../models/New');
const Cart = require('../models/Cart');
const getCartCount = require('../middlewares/cartCount'); // Import helper

class SiteController {
    // [GET] /news

    index(req, res, next) {
        const userId = req.session.userId;

        // Gọi helper để lấy tổng số lượng sản phẩm trong giỏ hàng
        getCartCount(userId)
            .then((cartCount) => {
                // Lấy thông tin sản phẩm và tin tức
                Promise.all([
                    Product.find({ special: true }).lean(), // Lọc sản phẩm có special: true
                    New.find({}).lean(), // Lấy tin tức
                ])
                    .then(([products, news]) => {
                        // Truyền dữ liệu vào view
                        res.render('home', {
                            products,
                            news,
                            cartCount, // Truyền tổng số lượng sản phẩm vào view
                        });
                    })
                    .catch((error) => {
                        next(error);
                    });
            })
            .catch((error) => {
                console.error('Error fetching cart count:', error);
                res.render('home', {
                    products: [], // Nếu không lấy được giỏ hàng, render với thông tin sản phẩm bình thường
                    news: [],
                    cartCount: 0, // Nếu có lỗi, hiển thị cartCount là 0
                });
            });
    }

    // [GET] /search
    search(req, res, next) {
        res.render('search');
    }
}

module.exports = new SiteController();
