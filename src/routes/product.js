const express = require('express');
const router = express.Router();

const productControllers = require('../app/controllers/ProductController');
router.get('/productShow', productControllers.show);
router.get('/combo/:slug', productControllers.ShowDetailCombo);
router.get('/combo', productControllers.showCombo);
router.get('/:slug', productControllers.showDetail);

// router.get('/trash/courses', meControllers.trash);

module.exports = router;
