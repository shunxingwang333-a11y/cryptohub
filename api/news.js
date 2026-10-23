const { sendJSON, handlePreflight } = require("./_shared");
const { listNews } = require("./_db");

module.exports = async (req, res) => {
    if (handlePreflight(req, res)) return;

    if (req.method !== "GET") {
        return sendJSON(res, 405, { error: "Method not allowed" });
    }

    try {
        const { category, search, page, perPage } = req.query;
        const result = await listNews({
            page: parseInt(page) || 1,
            perPage: parseInt(perPage) || 10,
            category: category || "",
            search: search || "",
            status: "published",
        });
        sendJSON(res, 200, result);
    } catch (err) {
        console.error("[news] list failed:", err);
        sendJSON(res, 500, { error: "资讯获取失败" });
    }
};