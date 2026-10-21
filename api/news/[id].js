const { getNews, saveNews, sendJSON } = require("../_shared");

module.exports = (req, res) => {
    if (req.method === "OPTIONS") {
        res.status(204)
           .setHeader("Access-Control-Allow-Origin", "*")
           .setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
           .setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
           .end();
        return;
    }

    if (req.method !== "GET") {
        return sendJSON(res, 405, { error: "Method not allowed" });
    }

    const id = parseInt(req.query.id);
    if (!id) {
        return sendJSON(res, 400, { error: "Invalid news ID" });
    }

    const news = getNews();
    const item = news.find(n => n.id === id);

    if (item) {
        item.views = (item.views || 0) + 1;
        saveNews(news);
        sendJSON(res, 200, item);
    } else {
        sendJSON(res, 404, { error: "News not found" });
    }
};
