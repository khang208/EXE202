class NewsControllers {
    //GET /new
    index(req, res) {
        res.render('news');
    }

    //[Get ] /new : slug
    show(req, res) {
        res.send('Detail !!!!!');
    }
}

module.exports = new NewsControllers();
