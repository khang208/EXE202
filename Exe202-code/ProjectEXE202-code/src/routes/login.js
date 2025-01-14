const express = require('express');
const router = express.Router();

const loginControllers = require('../app/controllers/LoginControllers');
router.get('/', loginControllers.create);
router.get('/pageRegister', loginControllers.pageRegister);
router.post('/register', loginControllers.register);
router.post('/login', loginControllers.login);
router.get('/logout', loginControllers.logout);
// router.get('/trash/courses', loginControllers.trash);

module.exports = router;
