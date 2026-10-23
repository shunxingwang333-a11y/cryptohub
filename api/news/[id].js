const { sendJSON, handlePreflight } = require("../_shared");
const { incrementViews } = require("../_db");

module.exports = async (req, res) => {
    if (handlePreflight(req, res)) return;

    if (req.method !== "GET") {
        return sendJSON(res, 405, { error: "Method not allowed" });
    }

    const id = parseInt(req.query.id);
    if (!id) {
        return sendJSON(res, 400, { error: "Invalid news ID" });
    }

    try {
        const item = await incrementViews(id);
        if (!item) {
            return sendJSON(res, 404, { error: "News not found" });
        }
        sendJSON(res, 200, item);
    } catch (err) {
        console.error("[news] detail failed:", err);
        sendJSON(res, 500, { error: "资讯详情获取失败" });
    }
};