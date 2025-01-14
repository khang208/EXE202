const Account = require('../models/Account');
const { mutipleMongoose } = require('../../until/mongoose');
const { response } = require('express');
const CircularJSON = require('circular-json');
const session = require('express-session');
class Mecontrollers {
    // [GET] /account/pageRegister
    async pageRegister(req, res, next) {
        try {
            const accounts = await Account.find().lean();
            res.render('account/register', {
                accountsJSON: JSON.stringify(accounts),
                errors: null, // No error start
                oldInput: {}, //No data forrm start
            });
        } catch (error) {
            console.error('Error fetching accounts:', error);
            res.status(500).send('Internal Server Error');
        }
        //     const accounts = await Account.find();
        // const cleanAccounts = accounts.map(account => account.toObject());
        // res.render('account/register', {
        //     accountsJSON: JSON.stringify(cleanAccounts)
        // });
    }
    // [GET] /account/create
    create(req, res, next) {
        res.render('account/create');
    }

    // [GET] /account/logout
    logout(req, res, next) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                return next(err);
            }

            // Xóa cookie liên quan đến session
            res.clearCookie('connect.sid', { path: '/' });

            // Chuyển hướng người dùng về trang đăng nhập hoặc trang chủ
            res.redirect('/'); // Thay '/login' bằng đường dẫn phù hợp
        });
    }
    // [POST] /account/login
    async login(req, res, next) {
        try {
            console.log('Request body:', req.body);

            const { username, password } = req.body;
            console.log('Request body:', req.body.username);

            // Tìm user theo username
            const user = await Account.findOne({ username });

            if (!user) {
                console.log('Headers:', req.headers);
                console.log('Body:', req.body);
                req.flash('error', 'Username không tồn tại.');
                console.log('dangh nhap thanh cong');
                console.log('===============', req.session);
                return res.redirect('/account');
            }

            // So sánh mật khẩu
            const isMatch = await user.matchPassword(password);

            if (!isMatch) {
                req.flash('error', 'Sai mật khẩu.');
                console.log('dangh nhap thanh cong');
                console.log('===============', req.session);
                return res.redirect('/account');
            }

            // Nếu thông tin đăng nhập đúng, lưu user vào session
            req.session.userId = user._id;
            req.session.username = user.username;
            req.session.role = user.role;
            console.log('Session sau khi đăng nhập:', req.session);
            // Lưu session và chuyển hướng dựa trên role
            req.session.save((err) => {
                if (err) {
                    console.error('Failed to save session:', err);
                    req.flash('error', 'Đã xảy ra lỗi khi lưu session.');
                    console.log('dangh nhap thanh cong');
                    console.log('===============', req.session);
                    return res.redirect('/account');
                }

                if (user.role === 'admin') {
                    return res.redirect('/account/admin');
                } else {
                    console.log('dangh nhap thanh cong');
                    console.log('===============', req.session);
                    return res.redirect('/');
                }
            });
        } catch (error) {
            console.error('Error during login:', error);
            req.flash('error', 'Đã xảy ra lỗi. Vui lòng thử lại.');
            console.log('===============', req.session);
            res.redirect('/account');
        }
    }

    //POST /account/register
    async register(req, res, next) {
        try {
            const { username, email, password } = req.body;

            // Kiểm tra username hoặc email đã tồn tại
            const usernameExists = await Account.exists({ username });
            const emailExists = await Account.exists({ email });
            const passwordEnter = await req.body.password;
            if (usernameExists || emailExists) {
                // Trả về lỗi và dữ liệu cũ
                const accounts = await Account.find().lean();
                return res.render('account/register', {
                    accountsJSON: JSON.stringify(accounts),
                    errors: {
                        username: usernameExists
                            ? 'Tên người dùng đã tồn tại'
                            : null,
                        email: emailExists ? 'Email đã được sử dụng' : null,
                        password: password,
                    },
                    oldInput: req.body,
                });
            }

            const account = new Account(req.body);
            await account.save();
            res.redirect('/account');
        } catch (error) {
            console.error('Error saving account:', error);
            res.status(500).send('Error creating account');
        }
    }
}

module.exports = new Mecontrollers();
