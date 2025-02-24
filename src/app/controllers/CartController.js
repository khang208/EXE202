const Account = require('../models/Account');
const { mutipleMongoose } = require('../../until/mongoose');
const { response } = require('express');
const CircularJSON = require('circular-json');
const session = require('express-session');
const Cart = require('../models/Cart');
const Combo = require('../models/Combo');
const Product = require('../models/Product');
const Order = require('../models/Order');
const getCartCount = require('../middlewares/cartCount'); // Import helper

const mongoose = require('mongoose');
class CartController {
    // Add product to cart
    async addToCart(req, res) {
        const { productId } = req.body;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Bạn cần đăng nhập trước khi thêm sản phẩm vào giỏ.',
            });
        }

        try {
            if (!mongoose.Types.ObjectId.isValid(productId)) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message: 'ProductId không hợp lệ',
                    });
            }

            const product = await Product.findById(productId);
            if (!product) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message: 'Sản phẩm không tồn tại',
                    });
            }

            // Lấy danh sách giỏ hàng của user hiện tại
            let cart = await Cart.findOne({ userId, payment: false }).populate(
                'items.productId',
            );

            // Nếu không có cart nào với payment = false, tạo mới
            if (!cart) {
                cart = new Cart({
                    userId,
                    items: [],
                    totalQuantity: 0,
                    totalPrice: 0,
                });
            }

            const productIndex = cart.items.findIndex(
                (item) =>
                    item.productId &&
                    item.productId._id.toString() === productId,
            );

            if (productIndex > -1) {
                cart.items[productIndex].quantity += 1;
            } else {
                cart.items.push({
                    productId: product._id,
                    quantity: 1,
                    name: product.name,
                    price: product.price,
                    type: 'product',
                });
            }

            cart.totalQuantity = cart.items.reduce(
                (sum, item) => sum + item.quantity,
                0,
            );

            cart.totalPrice = cart.items.reduce((sum, item) => {
                if (item.price) {
                    const price = parseFloat(
                        item.price
                            .replace('VND', '')
                            .replace(',', '')
                            .replace(/\./g, ''),
                    );
                    return sum + price * item.quantity;
                }
                return sum;
            }, 0);

            cart.totalPrice = cart.totalPrice.toLocaleString('vi-VN') + ' VND';

            await cart.save();

            req.session.cart = {
                items: cart.items,
                totalQuantity: cart.totalQuantity,
                totalPrice: cart.totalPrice,
                type: 'product',
            };

            const cartCount = await getCartCount(userId);

            res.json({
                success: true,
                message: 'Sản phẩm đã được thêm vào giỏ hàng.',
                cart: {
                    totalQuantity: cart.totalQuantity,
                    totalPrice: cart.totalPrice,
                },
                cartCount,
            });
        } catch (error) {
            console.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', error);
            res.status(500).json({ success: false, message: 'Đã xảy ra lỗi.' });
        }
    }

    // Add combo to cart
    async addToCartCombo(req, res) {
        const { comboId } = req.body;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Bạn cần đăng nhập trước khi thêm sản phẩm vào giỏ.',
            });
        }

        try {
            if (!mongoose.Types.ObjectId.isValid(comboId)) {
                return res.status(400).json({
                    success: false,
                    message: 'comboId không hợp lệ',
                });
            }

            const combo = await Combo.findById(comboId);
            if (!combo) {
                return res.status(400).json({
                    success: false,
                    message: 'Combo không tồn tại',
                });
            }

            // Lấy danh sách giỏ hàng của user hiện tại
            let cart = await Cart.findOne({ userId, payment: false }).populate(
                'items.comboId',
            );

            // Nếu không có cart nào với payment = false, tạo mới
            if (!cart) {
                cart = new Cart({
                    userId,
                    items: [],
                    totalQuantity: 0,
                    totalPrice: 0,
                });
            }

            const comboIndex = cart.items.findIndex(
                (item) =>
                    item.comboId && item.comboId._id.toString() === comboId,
            );

            if (comboIndex > -1) {
                cart.items[comboIndex].quantity += 1;
            } else {
                cart.items.push({
                    comboId: combo._id,
                    quantity: 1,
                    name: combo.name,
                    price: combo.price,
                    type: 'combo',
                });
            }

            cart.totalQuantity = cart.items.reduce(
                (sum, item) => sum + item.quantity,
                0,
            );

            cart.totalPrice = cart.items.reduce((sum, item) => {
                if (item.price) {
                    const price = parseFloat(item.price);
                    return sum + price * item.quantity;
                }
                return sum;
            }, 0);

            cart.totalPrice = cart.totalPrice.toLocaleString('vi-VN') + ' VND';

            await cart.save();

            req.session.cart = {
                items: cart.items,
                totalQuantity: cart.totalQuantity,
                totalPrice: cart.totalPrice,
                type: 'combo',
            };

            const cartCount = await getCartCount(userId);

            res.json({
                success: true,
                message: 'Combo đã được thêm vào giỏ hàng.',
                cart: {
                    totalQuantity: cart.totalQuantity,
                    totalPrice: cart.totalPrice,
                },
                cartCount,
            });
        } catch (error) {
            console.error('Error adding combo to cart:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi.',
            });
        }
    }

    // get cart===================================================================
    async storeCart(req, res) {
        const userId = req.session.userId;

        if (!userId) {
            req.flash('error', 'Bạn cần đăng nhập để xem giỏ hàng.');
            return res.redirect('/account');
        }

        try {
            // Lấy giỏ hàng chỉ khi payment = false và populate cả sản phẩm và combo
            let cart = await Cart.findOne({ userId, payment: false })
                .populate('items.productId')
                .populate('items.comboId'); // Populate comboId

            if (!cart) {
                // Nếu không tìm thấy giỏ hàng hoặc giỏ hàng không có payment = false
                cart = {
                    items: [],
                    totalQuantity: 0,
                    totalPrice: '0 VND',
                };
            } else {
                // Chỉ giữ lại các items hợp lệ (có productId hoặc comboId)
                const validItems = cart.items.filter(
                    (item) => item.productId || item.comboId,
                );

                // Tính toán lại totalPrice và đảm bảo dữ liệu đầy đủ
                const totalPrice = validItems.reduce((sum, item) => {
                    let itemPrice = 0;

                    if (item.productId?.price) {
                        // Loại bỏ định dạng và chuyển sang số
                        itemPrice =
                            parseFloat(
                                item.productId.price.replace(/[^\d]/g, ''),
                            ) || 0;
                    } else if (item.comboId?.price) {
                        // Tính giá combo
                        itemPrice =
                            parseFloat(
                                item.comboId.price.replace(/[^\d]/g, ''),
                            ) || 0;
                    }

                    return sum + itemPrice * item.quantity;
                }, 0);

                console.log('Total Price:', totalPrice);

                cart = {
                    items: validItems.map((item) => ({
                        productId: item.productId || null, // Đảm bảo productId là object đầy đủ nếu có
                        comboId: item.comboId || null, // Đảm bảo comboId là object đầy đủ nếu có
                        quantity: item.quantity,
                    })),
                    totalQuantity: validItems.reduce(
                        (sum, item) => sum + item.quantity,
                        0,
                    ),
                    totalPrice: totalPrice.toLocaleString('vi-VN') + ' VND',
                };
            }

            console.log('Cart Data Rendered:', cart);
            console.log(
                'Cart Items Populated:',
                JSON.stringify(cart.items, null, 2),
            );

            res.render('cart/cart', { cart });
        } catch (error) {
            console.error('Error loading cart:', error);
            res.status(500).send('Lỗi khi tải giỏ hàng');
        }
    }

    //minus ========================================================================
    // POST/ cart/minus
    async minus(req, res) {
        console.log('Minus Quantity Function Triggered');

        const { itemId } = req.body; // Lấy itemId từ body
        const userId = req.session.userId; // Lấy userId từ session

        console.log('User ID:', userId);
        console.log('Item ID:', itemId);

        if (!userId) {
            console.error('User is not logged in');
            return res.status(401).json({
                success: false,
                message: 'Bạn cần đăng nhập để thay đổi số lượng sản phẩm.',
            });
        }

        try {
            const cart = await Cart.findOne({ userId, payment: false })
                .populate('items.productId')
                .populate('items.comboId');

            if (!cart) {
                console.error('Cart not found');
                return res.status(400).json({
                    success: false,
                    message: 'Không tìm thấy giỏ hàng.',
                });
            }

            console.log('Cart found:', cart);

            const itemIndex = cart.items.findIndex(
                (item) =>
                    (item.productId &&
                        item.productId._id.toString() === itemId) ||
                    (item.comboId && item.comboId._id.toString() === itemId),
            );

            if (itemIndex === -1) {
                console.error('Item not found in cart');
                return res.status(404).json({
                    success: false,
                    message: 'Sản phẩm không tồn tại trong giỏ hàng.',
                });
            }

            console.log('Item found at index:', itemIndex);

            // Giảm số lượng hoặc xóa nếu số lượng là 1
            const item = cart.items[itemIndex];
            if (item.quantity > 1) {
                item.quantity -= 1;
                console.log(
                    `Quantity reduced for item: ${itemId}, new quantity: ${item.quantity}`,
                );
            } else {
                cart.items.splice(itemIndex, 1); // Xóa sản phẩm khỏi giỏ
                console.log(`Item removed from cart: ${itemId}`);
            }

            // Cập nhật tổng số lượng và giá
            cart.totalQuantity = cart.items.reduce(
                (sum, item) => sum + item.quantity,
                0,
            );
            cart.totalPrice = cart.items.reduce((sum, item) => {
                const price = parseFloat(
                    (
                        item.productId?.price ||
                        item.comboId?.price ||
                        '0'
                    ).replace(/[^\d]/g, ''),
                );
                return sum + price * item.quantity;
            }, 0);

            // Định dạng lại totalPrice thành "xxx.xxx VND"
            cart.totalPrice = cart.totalPrice.toLocaleString('vi-VN') + ' VND';

            console.log('Cart updated successfully:', cart);

            await cart.save();

            // Trả kết quả về cho client
            res.json({
                success: true,
                message: 'Số lượng sản phẩm đã được giảm.',
                cart: {
                    totalQuantity: cart.totalQuantity,
                    totalPrice: cart.totalPrice,
                },
            });
        } catch (error) {
            console.error('Error reducing quantity:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi thay đổi số lượng sản phẩm.',
            });
        }
    }

    // POST/ cart/plus
    async plus(req, res) {
        console.log('Plus Quantity Function Triggered');

        const { itemId } = req.body; // Lấy itemId từ body
        const userId = req.session.userId; // Lấy userId từ session

        console.log('User ID:', userId);
        console.log('Item ID:', itemId);

        if (!userId) {
            console.error('User is not logged in');
            return res.status(401).json({
                success: false,
                message: 'Bạn cần đăng nhập để thay đổi số lượng sản phẩm.',
            });
        }

        try {
            const cart = await Cart.findOne({ userId, payment: false })
                .populate('items.productId')
                .populate('items.comboId');

            if (!cart) {
                console.error('Cart not found');
                return res.status(400).json({
                    success: false,
                    message: 'Không tìm thấy giỏ hàng.',
                });
            }

            console.log('Cart found:', cart);

            const itemIndex = cart.items.findIndex(
                (item) =>
                    (item.productId &&
                        item.productId._id.toString() === itemId) ||
                    (item.comboId && item.comboId._id.toString() === itemId),
            );

            if (itemIndex === -1) {
                console.error('Item not found in cart');
                return res.status(404).json({
                    success: false,
                    message: 'Sản phẩm không tồn tại trong giỏ hàng.',
                });
            }

            console.log('Item found at index:', itemIndex);

            // Tăng số lượng sản phẩm lên 1
            const item = cart.items[itemIndex];
            item.quantity += 1; // Tăng số lượng lên 1
            console.log(
                `Quantity increased for item: ${itemId}, new quantity: ${item.quantity}`,
            );

            // Cập nhật tổng số lượng và giá
            cart.totalQuantity = cart.items.reduce(
                (sum, item) => sum + item.quantity,
                0,
            );
            cart.totalPrice = cart.items.reduce((sum, item) => {
                const price = parseFloat(
                    (
                        item.productId?.price ||
                        item.comboId?.price ||
                        '0'
                    ).replace(/[^\d]/g, ''),
                );
                return sum + price * item.quantity;
            }, 0);

            // Định dạng lại totalPrice thành "xxx.xxx VND"
            cart.totalPrice = cart.totalPrice.toLocaleString('vi-VN') + ' VND';

            console.log('Cart updated successfully:', cart);

            await cart.save();

            // Trả kết quả về cho client
            res.json({
                success: true,
                message: 'Số lượng sản phẩm đã được tăng.',
                cart: {
                    totalQuantity: cart.totalQuantity,
                    totalPrice: cart.totalPrice,
                },
            });
        } catch (error) {
            console.error('Error increasing quantity:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi thay đổi số lượng sản phẩm.',
            });
        }
    }

    async delete(req, res) {
        console.log('Minus Quantity Function Triggered');

        const { itemId } = req.body; // Lấy itemId từ body
        console.log('Received itemId:', itemId);

        if (!itemId) {
            console.error('itemId is undefined');
            return res.status(400).json({
                success: false,
                message: 'Thiếu itemId trong yêu cầu.',
            });
        }

        const userId = req.session.userId; // Lấy userId từ session

        console.log('User ID:', userId);
        console.log('Item ID:', itemId);

        if (!userId) {
            console.error('User is not logged in');
            return res.status(401).json({
                success: false,
                message: 'Bạn cần đăng nhập để thay đổi số lượng sản phẩm.',
            });
        }

        try {
            const cart = await Cart.findOne({ userId })
                .populate('items.productId')
                .populate('items.comboId');

            if (!cart) {
                console.error('Cart not found');
                return res.status(400).json({
                    success: false,
                    message: 'Không tìm thấy giỏ hàng.',
                });
            }

            console.log('Cart found:', cart);

            const itemIndex = cart.items.findIndex(
                (item) =>
                    (item.productId &&
                        item.productId._id.toString() === itemId) ||
                    (item.comboId && item.comboId._id.toString() === itemId),
            );

            if (itemIndex === -1) {
                console.error('Item not found in cart');
                return res.status(404).json({
                    success: false,
                    message: 'Sản phẩm không tồn tại trong giỏ hàng.',
                });
            }

            console.log('Item found at index:', itemIndex);

            // Giảm số lượng hoặc xóa nếu số lượng là 1
            const item = cart.items[itemIndex];
            if (item) {
                cart.items.splice(itemIndex, 1); // Xóa sản phẩm khỏi giỏ
                console.log(`Item removed from cart: ${itemId}`);
            }

            // Cập nhật tổng số lượng và giá
            cart.totalQuantity = cart.items.reduce(
                (sum, item) => sum + item.quantity,
                0,
            );
            cart.totalPrice = cart.items.reduce((sum, item) => {
                const price = parseFloat(
                    (
                        item.productId?.price ||
                        item.comboId?.price ||
                        '0'
                    ).replace(/[^\d]/g, ''),
                );
                return sum + price * item.quantity;
            }, 0);

            // Định dạng lại totalPrice thành "xxx.xxx VND"
            cart.totalPrice = cart.totalPrice.toLocaleString('vi-VN') + ' VND';

            console.log('Cart updated successfully:', cart);

            await cart.save();

            // Trả kết quả về cho client
            res.json({
                success: true,
                message: 'Số lượng sản phẩm đã được xóa.',
                cart: {
                    totalQuantity: cart.totalQuantity,
                    totalPrice: cart.totalPrice,
                },
            });
        } catch (error) {
            console.error('Error reducing quantity:', error);
            res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi thay đổi số lượng sản phẩm.',
            });
        }
    }
    //pay cart =========================================================/cart/payment
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
