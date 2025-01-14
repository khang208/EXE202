const express = require('express');
const router = express.Router();

const customGiftControllers = require('../app/controllers/CartController');
router.get('/', customGiftControllers.storeCart);
router.post('/minus', customGiftControllers.minus);
router.post('/payment', customGiftControllers.payment);
router.post('/plus', customGiftControllers.plus);
router.post('/delete', customGiftControllers.delete);
router.post('/add-to-cart/combo', customGiftControllers.addToCartCombo);
router.post('/add-to-cart', customGiftControllers.addToCart);

// router.get('/trash/courses', customGiftControllers.trash);

module.exports = router;
