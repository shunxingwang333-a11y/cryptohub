const { getNews, saveNews, sendJSON, checkAuth, ADMIN_TOKEN } = require("../../_shared");

module.exports = (req, res) => {
    if (req.method === "OPTIONS") {
        res.status(204)
           .setHeader("Access-Control-Allow-Origin", "*")
           .setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
           .setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
           .end();
        return;
    }

    if (!checkAuth(req) && req.query.token !== ADMIN_TOKEN) {
        return sendJSON(res, 401, { error: "未授权" });
    }

    const id = parseInt(req.query.id);
    if (!id) {
        return sendJSON(res, 400, { error: "Invalid news ID" });
    }

    if (req.method === "PUT") {
        const news = getNews();
        const idx = news.findIndex(n => n.id === id);
        if (idx === -1) {
            return sendJSON(res, 404, { error: "News not found" });
        }
        const body = req.body || {};
        news[idx] = {
            ...news[idx],
            title: body.title !== undefined ? body.title : news[idx].title,
            summary: body.summary !== undefined ? body.summary : news[idx].summary,
            content: body.content !== undefined ? body.content : news[idx].content,
            category: body.category !== undefined ? body.category : news[idx].category,
            source: body.source !== undefined ? body.source : news[idx].source,
            author: body.author !== undefined ? body.author : news[idx].author,
            status: body.status !== undefined ? body.status : news[idx].status,
            publishedAt: body.publishedAt !== undefined ? body.publishedAt : news[idx].publishedAt,
        };
        saveNews(news);
        return sendJSON(res, 200, news[idx]);
    }

    if (req.method === "DELETE") {
        const news = getNews();
        const idx = news.findIndex(n => n.id === id);
        if (idx === -1) {
            return sendJSON(res, 404, { error: "News not found" });
        }
        const deleted = news.splice(idx, 1);
        saveNews(news);
        return sendJSON(res, 200, { success: true, deleted: deleted[0] });
    }

    sendJSON(res, 405, { error: "Method not allowed" });
};
