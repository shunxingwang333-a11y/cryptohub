const { sendJSON, checkAuth, handlePreflight, ADMIN_TOKEN } = require("../_shared");
const { listNews, createNews } = require("../_db");

module.exports = async (req, res) => {
    if (handlePreflight(req, res)) return;

    if (!checkAuth(req) && req.query.token !== ADMIN_TOKEN) {
        return sendJSON(res, 401, { error: "未授权" });
    }

    try {
        if (req.method === "GET") {
            const result = await listNews({
                page: parseInt(req.query.page) || 1,
                perPage: parseInt(req.query.perPage) || 20,
                category: req.query.category || "",
                search: req.query.search || "",
                status: req.query.status || "",
            });
            return sendJSON(res, 200, result);
        }

        if (req.method === "POST") {
            const body = req.body || {};
            if (!body.title || !String(body.title).trim()) {
                return sendJSON(res, 400, { error: "标题不能为空" });
            }
            const item = await createNews({
                title: String(body.title).trim(),
                summary: body.summary || "",
                content: body.content || "",
                category: body.category || "general",
                source: body.source || "CryptoHub",
                author: body.author || "管理员",
                publishedAt: body.publishedAt || new Date().toISOString(),
                status: body.status || "published",
            });
            return sendJSON(res, 201, item);
        }

        sendJSON(res, 405, { error: "Method not allowed" });
    } catch (err) {
        console.error("[admin/news] failed:", err);
        sendJSON(res, 500, { error: "服务器错误" });
    }
};