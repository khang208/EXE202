const mongoose = require('mongoose');
async function connect() {
    try {
        mongoose
            .connect(
                'mongodb+srv://khangnbce170268:wbEYDYrSN5v37oX6@data.q51v8.mongodb.net/exe202',  
            )
            .then(() => console.log('Connected!'));
    } catch (error) {
        console.log('fail!');
    }
}
module.exports = { connect };

// mongodb://localhost:27017/exe201
