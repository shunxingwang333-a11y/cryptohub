// TEMPORARY verification endpoint — removed after the persistence check.
// ?leave=1 writes a durable marker record; a plain GET reports whether it
// survived, which proves the data outlives the serverless instance.
const { sendJSON } = require("./_shared");
const { listNews, createNews, deleteNews } = require("./_db");

const MARKER = "持久化验证-永久标记";

module.exports = async (req, res) => {
    try {
        if (req.query.leave === "1") {
            const existing = (await listNews({ perPage: 1000 })).items.find(
                (n) => n.title === MARKER
            );
            if (existing) await deleteNews(existing.id);
            const created = await createNews({
                title: MARKER,
                summary: "该记录用于验证冷启动后数据仍然存在",
                content: "写入时间早于本次部署，用于确认数据存储在数据库而非内存。",
                category: "btc",
                source: "CryptoHub",
                author: "管理员",
                publishedAt: new Date().toISOString(),
                status: "published",
            });
            return sendJSON(res, 200, { action: "left_marker", id: created.id });
        }

        const found = (await listNews({ perPage: 1000 })).items.find((n) => n.title === MARKER);
        const total = (await listNews({ perPage: 1 })).total;
        sendJSON(res, 200, {
            action: "check",
            marker_present: !!found,
            marker: found || null,
            total,
        });
    } catch (err) {
        console.error("[selftest] failed:", err);
        sendJSON(res, 500, { error: err.message });
    }
};