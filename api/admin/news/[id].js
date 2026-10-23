const { sendJSON, checkAuth, handlePreflight, ADMIN_TOKEN } = require("../../_shared");
const { updateNews, deleteNews, getNewsById } = require("../../_db");

module.exports = async (req, res) => {
    if (handlePreflight(req, res)) return;

    if (!checkAuth(req) && req.query.token !== ADMIN_TOKEN) {
        return sendJSON(res, 401, { error: "未授权" });
    }

    const id = parseInt(req.query.id);
    if (!id) {
        return sendJSON(res, 400, { error: "Invalid news ID" });
    }

    try {
        if (req.method === "PUT") {
            const updated = await updateNews(id, req.body || {});
            if (!updated) {
                return sendJSON(res, 404, { error: "News not found" });
            }
            return sendJSON(res, 200, updated);
        }

        if (req.method === "DELETE") {
            const existing = await getNewsById(id);
            if (!existing) {
                return sendJSON(res, 404, { error: "News not found" });
            }
            const deleted = await deleteNews(id);
            return sendJSON(res, 200, { success: true, deleted });
        }

        sendJSON(res, 405, { error: "Method not allowed" });
    } catch (err) {
        console.error("[admin/news/:id] failed:", err);
        sendJSON(res, 500, { error: "服务器错误" });
    }
};