const Cart = require('../models/Cart');

module.exports = async function getCartCount(userId) {
    try {
        const cart = await Cart.findOne({ userId, payment: false });
        return cart ? cart.totalQuantity : 0; // Trả về tổng số lượng sản phẩm trong giỏ hàng
    } catch (error) {
        console.error('Error fetching cart count:', error);
        return 0; // Trả về 0 nếu có lỗi
    }
};
