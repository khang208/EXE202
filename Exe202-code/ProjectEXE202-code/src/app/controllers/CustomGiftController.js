const Account = require("../models/Account");
const { mutipleMongoose } = require("../../until/mongoose");
const { response } = require("express");
const CircularJSON = require("circular-json");
const session = require("express-session");
const Cart = require("../models/Cart");
const Combo = require("../models/Combo");
const Product = require("../models/Product");
const Box = require("../models/Box");
const Mes = require("../models/Mes");
const CustomBox = require("../models/CustomBox");
const Order = require("../models/Order");
const getCartCount = require("../middlewares/cartCount"); // Import helper

const mongoose = require("mongoose");

class CartController {
    // Add product to cart
    showCustom(req, res) {
        Product.find({}).lean()
            .then((products) => {
                res.render("customGift/customProduct", { products })
            })
            .catch((error) => {
                next(error);
            });
    }


    showCustomBox(req, res) {

        Box.find({}).lean()
            .then((boxs) => {
                res.render("customGift/customBox", { boxs })
            })
            .catch((error) => {
                next(error);
            });
    }

    showCustomMes(req, res) {
        Mes.find({}).lean()
            .then((mess) => {
                res.render("customGift/customMes", { mess })
            })
            .catch((error) => {
                next(error);
            });
    }



    showGuideGift(req, res) {
        Mes.find({}).lean()
            .then((mess) => {
                res.render("customGift/guideGift", { mess })
            })
            .catch((error) => {
                next(error);
            });
    }



    // POST custom-gift/minus
    async minus(req, res) {
        const { itemId } = req.body;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Bạn cần đăng nhập trước khi giảm số lượng sản phẩm.",
            });
        }

        if (!itemId) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin sản phẩm.",
            });
        }

        try {
            let customBox = await CustomBox.findOne({ userId }).populate("items.productId");
            if (!customBox) {
                return res.status(404).json({
                    success: false,
                    message: "Không tìm thấy giỏ hàng của bạn.",
                });
            }

            const itemIndex = customBox.items.findIndex(
                (item) => item.productId && item.productId._id.toString() === itemId
            );

            if (itemIndex === -1) {
                const product = await Product.findById(itemId);
                if (!product) {
                    return res.status(404).json({
                        success: false,
                        message: "Sản phẩm không tồn tại.",
                    });
                }

                const newItem = {
                    productId: itemId,
                    quantity: 0, // Thêm mới với số lượng ban đầu = 1
                    price: product.price,
                    name: product.name,
                };
                customBox.items.push(newItem);
            } else {

                const item = customBox.items[itemIndex];

                if (item.quantity >= 1) {
                    item.quantity -= 1;
                    if (item.quantity === 0) {
                        customBox.items.splice(itemIndex, 1);
                    }
                } else {
                    customBox.items.splice(itemIndex, 1); // Xóa sản phẩm nếu số lượng = 1
                }
            }
            customBox.totalQuantity = customBox.items.reduce(
                (sum, item) => sum + item.quantity,
                0
            );
            customBox.totalPrice = customBox.items.reduce((sum, item) => {
                const price = parseFloat(item.price.replace(/[^\d]/g, "")) || 0;
                return sum + price * item.quantity;
            }, 0);
            customBox.totalPrice = customBox.totalPrice.toLocaleString("vi-VN") + " VND";

            await customBox.save();
            await customBox.populate("items.productId");
            res.json({
                success: true,
                message: "Sản phẩm đã được giảm thành công.",
                customBox: {
                    totalQuantity: customBox.totalQuantity,
                    totalPrice: customBox.totalPrice,
                    items: customBox.items,
                },
            });
        } catch (error) {
            console.error("Lỗi khi giảm sản phẩm:", error);
            res.status(500).json({
                success: false,
                message: "Đã xảy ra lỗi khi xử lý yêu cầu.",
            });
        }
    }









    
    async plus(req, res) {
        const { itemId } = req.body;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Bạn cần đăng nhập trước khi thêm sản phẩm.",
            });
        }

        if (!itemId) {
            return res.status(400).json({
                success: false,
                message: "Thiếu thông tin sản phẩm.",
            });
        }

        try {
            let customBox = await CustomBox.findOne({ userId }).populate("items.productId");
            if (!customBox) {
                customBox = new CustomBox({
                    userId,
                    items: [],
                    totalQuantity: 0,
                    totalPrice: "0 VND",
                });
                await customBox.save();
            }

            let itemIndex = customBox.items.findIndex(
                (item) => item.productId && item.productId._id.toString() === itemId
            );

            if (itemIndex === -1) {
                const product = await Product.findById(itemId);
                if (!product) {
                    return res.status(404).json({
                        success: false,
                        message: "Sản phẩm không tồn tại.",
                    });
                }

                const newItem = {
                    productId: itemId,
                    quantity: 1, // Thêm mới với số lượng ban đầu = 1
                    price: product.price,
                    name: product.name,
                };
                customBox.items.push(newItem);
            } else {
                customBox.items[itemIndex].quantity += 1;
            }

            customBox.totalQuantity = customBox.items.reduce(
                (sum, item) => sum + item.quantity,
                0
            );
            customBox.totalPrice = customBox.items.reduce((sum, item) => {
                const price = parseFloat(item.price.replace(/[^\d]/g, "")) || 0;
                return sum + price * item.quantity;
            }, 0);
            customBox.totalPrice = customBox.totalPrice.toLocaleString("vi-VN") + " VND";

            await customBox.save();
            await customBox.populate("items.productId");
            res.json({
                success: true,
                message: "Sản phẩm đã được thêm thành công.",
                customBox: {
                    totalQuantity: customBox.totalQuantity,
                    totalPrice: customBox.totalPrice,
                    items: customBox.items,
                },
            });
        } catch (error) {
            console.error("Lỗi khi thêm sản phẩm:", error);
            res.status(500).json({
                success: false,
                message: "Đã xảy ra lỗi khi xử lý yêu cầu.",
            });
        }
    }



    async resetCart(req, res) {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ success: false, message: "Bạn cần đăng nhập." });

        try {
            await CustomBox.findOneAndUpdate(
                { userId },
                { items: [], totalQuantity: 0, totalPrice: "0 VND" }
            );
            res.json({ success: true, message: "Giỏ hàng đã được reset!" });
        } catch (error) {
            console.error("Lỗi reset giỏ hàng:", error);
            res.status(500).json({ success: false, message: "Lỗi khi reset giỏ hàng." });
        }
    }


 async payment(req, res) {
        const userId = req.session.userId;

        // Kiểm tra người dùng đã đăng nhập chưa
        if (!userId) {
            req.flash('error', 'Bạn cần đăng nhập để xem giỏ hàng.');
            return res.redirect('/account');
        }

        try {
            // Lấy giỏ hàng của người dùng từ collection Cart
            const cart = await Cart.findOne({ userId, payment: false });

            // Kiểm tra nếu giỏ hàng không tồn tại hoặc không có sản phẩm/combo
            if (!cart || cart.items.length === 0) {
                req.flash(
                    'error',
                    'Giỏ hàng của bạn không có sản phẩm nào để thanh toán.',
                );
                return res.redirect('/cart'); // Điều hướng lại trang giỏ hàng
            }

            const { name, phone, address, email } = req.body;

            // Tạo một đơn hàng mới từ dữ liệu giỏ hàng
            const order = new Order({
                name,
                phone,
                address,
                email,
                items: cart.items.map((item) => ({
                    productId: item.productId || null,
                    comboId: item.comboId || null,
                    quantity: item.quantity,
                    name: item.name,
                    price: item.price,
                    oderCode: item.oderCode,
                })),
            });

            // Lưu đơn hàng
            await order.save();
            console.log('đay là order ', order);
            // Cập nhật trạng thái thanh toán trong collection Cart
            cart.payment = true;
            const cartCount = await getCartCount(userId);
            // Đặt cartCount về 0 vì giỏ hàng đã được thanh toán
            cart.items = [];
            cart.cartCount = 0;

            // Lưu lại giỏ hàng đã cập nhật
            await cart.save();

            req.flash('success', 'Thanh toán thành công!');
            res.redirect('/', cartCount);
        } catch (error) {
            console.error('Error during payment:', error);
            req.flash('error', 'Đã xảy ra lỗi trong quá trình thanh toán.');
            res.status(500).redirect('/cart');
        }
    }



}


module.exports = new CartController();
