const { getNews, sendJSON, checkAuth, ADMIN_TOKEN } = require("../_shared");

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

    if (req.method === "GET") {
        let news = getNews();
        news.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 20;
        const total = news.length;
        const items = news.slice((page - 1) * perPage, page * perPage);

        return sendJSON(res, 200, { total, page, perPage, items });
    }

    if (req.method === "POST") {
        const news = getNews();
        const newId = news.length > 0 ? Math.max(...news.map(n => n.id)) + 1 : 1;
        const body = req.body || {};
        const item = {
            id: newId,
            title: body.title || "无标题",
            summary: body.summary || "",
            content: body.content || "",
            category: body.category || "general",
            source: body.source || "CryptoHub",
            author: body.author || "管理员",
            publishedAt: body.publishedAt || new Date().toISOString(),
            status: body.status || "published",
            views: 0,
        };
        news.push(item);
        sendJSON(res, 201, item);
        return;
    }

    sendJSON(res, 405, { error: "Method not allowed" });
};
