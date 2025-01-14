const express = require('express');
const path = require('path');
const morgan = require('morgan');
const handlebars = require('express-handlebars').engine;
const methodOverride = require('method-override');
const app = express();
const port = 3000;
const route = require('./routes/index');
const db = require('./config/db');
const SortMiddleware = require('./app/middlewares/SortMiddleware');
const { console } = require('inspector');
const session = require('express-session');
const flash = require('connect-flash');
const bodyParser = require('body-parser');
const Cart = require('../src/app/models/Cart');
const cors = require('cors');
app.use(cors());
db.connect();

app.use(express.static(path.join(__dirname, 'public')));
app.engine(
    'hbs',

    handlebars({
        defaultLayout: 'main',
        runtimeOptions: {
            allowProtoPropertiesByDefault: true,
            allowProtoMethodsByDefault: true,
        },
        extname: '.hbs',
        helpers: {
            untimeOptions: {
                allowProtoPropertiesByDefault: true,
                allowProtoMethodsByDefault: true,
            },

            eq: async (a, b) => a.toString() === b.toString(),
            getCartCount: async (userId) => {
                try {
                    const cart = await Cart.findOne({ userId });
                    return cart ? cart.totalQuantity : 0; // Trả về tổng số lượng sản phẩm trong giỏ hàng
                } catch (error) {
                    console.error('Error fetching cart count:', error);
                    return 0; // Trả về 0 nếu có lỗi
                }
            },
            findQuantity: (items, productId) => {
                if (!Array.isArray(items)) {
                    return 0; // Trả về 0 nếu items không phải là mảng
                }
                const item = items.find(
                    (i) => i.productId._id.toString() === productId.toString(),
                );
                return item ? item.quantity : 0;
            },
            formatPrice: (price, quantity) => {
                if (!price) return '0VND';
                const numericPrice = parseFloat(
                    price
                        .replace('VND', '')
                        .replace(',', '')
                        .replace(/\./g, ''),
                );

                // Tính tổng giá
                const total = numericPrice * (quantity || 1); // nhân với quantity nếu có

                // Định dạng số thành xxx.xxxVND
                return total.toLocaleString('vi-VN') + 'VND';
            },
            multiply: (a, b) => a * b,
            sum: (a, b) => a + b,
            sortable: (field, sort) => {
                const sortType = field === sort.column ? sort.type : 'default';

                const icons = {
                    default: 'elevator',
                    asc: 'arrow_upward',
                    desc: 'arrow_downward',
                };
                const types = {
                    default: 'desc',
                    asc: 'desc',
                    desc: 'asc',
                };
                const icon = icons[sortType];
                const type = types[sortType];

                return `<a href="?_sort&column=${field}&type=${type}">
                          <span class="material-icons">${icon}</span>
                        </a>`;
            },
        },
    }),
);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'resources', 'views'));
app.use(morgan('combined'));
app.use(methodOverride('_method'));
//SortMiddleware cusstom
app.use(SortMiddleware);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Flash messages
app.use(flash());
app.use(
    session({
        secret: 'catAndDog',
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: 30 * 60 * 1000,
            secure: false,
        },
    }),
);
app.use((req, res, next) => {
    console.log('Request body nè ========:', req.body);
    next();
});

route(app);

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});
