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
const { render } = require("node-sass");
class CartController {
 // Add product to cart
 showCustom(req, res){
    Product.find({}).lean()
    .then((products)=>{
        res.render("customGift/customProduct", {products})
    })
    .catch((error) => {
        next(error);
    });
 }
 

 showCustomBox(req, res){

    Box.find({}).lean()
    .then((boxs)=>{
    res.render("customGift/customBox",{boxs})
    })
    .catch((error) => {
        next(error);
    });
   }

   showCustomMes(req, res){
    Mes.find({}).lean()
    .then((mess)=>{
    res.render("customGift/customMes",{mess})
    })
    .catch((error) => {
        next(error);
    });
   }

    //POST custom-gift/minus
    // async minus(req, res) {
    //     const { itemId } = req.body; // Chỉ cần `itemId` để xác định sản phẩm cần giảm số lượng
    //     const userId = req.session.userId; // Xác định người dùng hiện tại
    //   console.log("itemID================", req.body)
    //   console.log("userID================", userId)
    //     if (!userId) {
    //         return res.status(401).json({
    //           success: false,
    //           message: "Bạn cần đăng nhập trước khi thêm sản phẩm vào giỏ.",
    //         });
    //       }
    //     try {
    //       // Kiểm tra hoặc tạo mới CustomBox cho người dùng nếu chưa có
    //       let customBox = await CustomBox.findOne({ userId }).populate("items.productId");
    //       if (!customBox) {
    //         customBox = new CustomBox({
    //           userId,
    //           items: [],
    //           totalQuantity: 0,
    //           totalPrice: "0 VND",
    //         });
    //         await customBox.save();
    //       }
    //       console.log("customBox================", customBox)
      
    //       // Tìm sản phẩm trong danh sách CustomBox
    //       const itemIndex = customBox.items.findIndex(
    //         (item) => item.productId && item.productId._id.toString() === itemId
    //       );
    //   console.log("index =================", itemIndex)
    //       if (itemIndex === -1) {
    //         return res.status(400).json({
    //           success: false,
    //           message: "Sản phẩm không có trong giỏ hàng.",
    //         });
    //       }
      
    //       const item = customBox.items[itemIndex];
      
    //       // Giảm số lượng sản phẩm nếu lớn hơn 1
    //       if (item.quantity > 1) {
    //         item.quantity -= 1;
    //       } else {
    //         return res.status(400).json({
    //           success: false,
    //           message: "Số lượng sản phẩm không thể nhỏ hơn 1.",
    //         });
    //       }
      
    //       // Tính toán lại tổng số lượng và tổng giá
    //       customBox.totalQuantity = customBox.items.reduce(
    //         (sum, item) => sum + item.quantity,
    //         0
    //       );
    //       customBox.totalPrice = customBox.items.reduce((sum, item) => {
    //         const price = parseFloat(item.price.replace(/[^\d]/g, ""));
    //         return sum + price * item.quantity;
    //       }, 0);
      
    //       // Định dạng lại tổng giá
    //       customBox.totalPrice = customBox.totalPrice.toLocaleString("vi-VN") + " VND";
      
    //       // Lưu lại CustomBox
    //       await customBox.save();
      
    //       res.json({
    //         success: true,
    //         message: "Sản phẩm đã được giảm thành công.",
    //         customBox: {
    //           totalQuantity: customBox.totalQuantity,
    //           totalPrice: customBox.totalPrice,
    //         },
    //       });
    //     } catch (error) {
    //       console.error("Lỗi khi giảm sản phẩm trong CustomBox:", error);
    //       res.status(500).json({
    //         success: false,
    //         message: "Đã xảy ra lỗi khi giảm sản phẩm.",
    //       });
    //     }
    //   }

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
            } 
    
            const item = customBox.items[itemIndex];
    
            if (item.quantity >= 1) {
                item.quantity -= 1;
            } else {
                customBox.items.splice(itemIndex, 1); // Xóa sản phẩm nếu số lượng = 1
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
    
    

}


module.exports = new CartController();
