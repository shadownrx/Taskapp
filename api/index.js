const { app, connectDB } = require('../server/server');

module.exports = async (req, res) => {
    await connectDB();
    app(req, res);
};
