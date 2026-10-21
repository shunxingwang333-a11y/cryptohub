const { getNews, sendJSON } = require("./_shared");

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

    let news = getNews().filter(n => n.status === "published");
    news.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    const { category, search, page: pageStr, perPage: perPageStr } = req.query;

    if (category) {
        news = news.filter(n => n.category === category);
    }

    if (search) {
        const q = search.toLowerCase();
        news = news.filter(n =>
            n.title.toLowerCase().includes(q) ||
            n.summary.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q)
        );
    }

    const page = parseInt(pageStr) || 1;
    const perPage = parseInt(perPageStr) || 10;
    const total = news.length;
    const items = news.slice((page - 1) * perPage, page * perPage);

    sendJSON(res, 200, { total, page, perPage, items });
};
