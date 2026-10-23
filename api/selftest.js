// TEMPORARY verification endpoint — removed after the persistence check.
const { sendJSON } = require("./_shared");
const { listNews, createNews, getNewsById, updateNews, deleteNews } = require("./_db");

module.exports = async (req, res) => {
    const stamp = Date.now();
    const steps = [];
    try {
        const before = await listNews({ page: 1, perPage: 1 });
        steps.push({ step: "count_before", total: before.total });

        const created = await createNews({
            title: `持久化验证-${stamp}`,
            summary: "验证数据库写入",
            content: "此条记录用于验证服务端无状态函数重启后数据仍然保留。",
            category: "btc",
            source: "CryptoHub",
            author: "管理员",
            publishedAt: new Date().toISOString(),
            status: "published",
        });
        steps.push({ step: "create", id: created.id });

        const reread = await getNewsById(created.id);
        steps.push({ step: "reread", found: !!reread, title: reread && reread.title });

        const updated = await updateNews(created.id, { title: `持久化验证-已更新-${stamp}` });
        steps.push({ step: "update", ok: updated.title === `持久化验证-已更新-${stamp}` });

        const after = await listNews({ page: 1, perPage: 1 });
        steps.push({ step: "count_after", total: after.total });

        const del = await deleteNews(created.id);
        steps.push({ step: "cleanup", deleted: !!del });

        sendJSON(res, 200, { stamp, steps });
    } catch (err) {
        console.error("[selftest] failed:", err);
        sendJSON(res, 500, { stamp, steps, error: err.message });
    }
};