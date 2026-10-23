// TEMPORARY verification endpoint — deleted after cleanup.
const { sendJSON } = require("./_shared");
const { listNews, deleteNews } = require("./_db");

module.exports = async (req, res) => {
    try {
        const all = (await listNews({ perPage: 1000 })).items;
        const targets = all.filter((n) => n.title.startsWith("持久化验证-"));
        const removed = [];
        for (const item of targets) {
            await deleteNews(item.id);
            removed.push(item.id);
        }
        const remaining = (await listNews({ perPage: 1000 })).items.length;
        sendJSON(res, 200, { removed, remaining });
    } catch (err) {
        console.error("[selftest] cleanup failed:", err);
        sendJSON(res, 500, { error: err.message });
    }
};