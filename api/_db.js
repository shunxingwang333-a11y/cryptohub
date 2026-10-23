// News data layer backed by Neon Postgres (Vercel serverless).
//
// DATABASE_URL is injected by the Vercel Neon storage integration. If it is
// missing we fall back to the in-memory seed store so the site still renders
// during local development or on deploys without storage attached.

const { neon } = require("@neondatabase/serverless");
const { SEED_NEWS } = require("./seed-news");

let sql = null;
let schemaReady = null;
let memoryFallback = null;

function db() {
    if (sql) return sql;
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) return null;
    try {
        sql = neon(url);
        return sql;
    } catch (err) {
        console.error("[db] failed to initialise Neon client:", err.message);
        return null;
    }
}

function isPersistent() {
    return db() !== null;
}

// In-memory mirror used only when no database is configured.
function memory() {
    if (!memoryFallback) memoryFallback = JSON.parse(JSON.stringify(SEED_NEWS));
    return memoryFallback;
}

async function ensureSchema() {
    if (schemaReady) return schemaReady;
    schemaReady = (async () => {
        const q = db();
        if (!q) return false;

        await q`CREATE TABLE IF NOT EXISTS news (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            summary TEXT NOT NULL DEFAULT '',
            content TEXT NOT NULL DEFAULT '',
            category TEXT NOT NULL DEFAULT 'general',
            source TEXT NOT NULL DEFAULT 'CryptoHub',
            author TEXT NOT NULL DEFAULT '管理员',
            published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            status TEXT NOT NULL DEFAULT 'published',
            views INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`;

        await q`CREATE INDEX IF NOT EXISTS news_published_at_idx ON news (published_at DESC)`;
        await q`CREATE INDEX IF NOT EXISTS news_status_idx ON news (status)`;

        // Seed once, only while the table is empty.
        const [{ count }] = await q`SELECT COUNT(*)::int AS count FROM news`;
        if (count === 0) {
            for (const item of SEED_NEWS) {
                await q`INSERT INTO news
                    (title, summary, content, category, source, author, published_at, status, views)
                VALUES (
                    ${item.title}, ${item.summary}, ${item.content}, ${item.category},
                    ${item.source}, ${item.author}, ${item.publishedAt},
                    ${item.status}, ${item.views}
                )`;
            }
            console.log(`[db] seeded ${SEED_NEWS.length} news items`);
        }
        return true;
    })().catch((err) => {
        console.error("[db] schema init failed:", err.message);
        schemaReady = null;
        return false;
    });

    return schemaReady;
}

function rowToNews(row) {
    if (!row) return null;
    return {
        id: row.id,
        title: row.title,
        summary: row.summary,
        content: row.content,
        category: row.category,
        source: row.source,
        author: row.author,
        publishedAt: new Date(row.published_at).toISOString(),
        status: row.status,
        views: row.views,
    };
}

// Lists news with optional status/category/search filters plus pagination.
async function listNews({ page = 1, perPage = 10, category = "", search = "", status = "" } = {}) {
    const q = db();
    if (!q || !(await ensureSchema())) {
        let items = memory();
        if (status) items = items.filter((n) => n.status === status);
        if (category) items = items.filter((n) => n.category === category);
        if (search) {
            const needle = search.toLowerCase();
            items = items.filter(
                (n) =>
                    n.title.toLowerCase().includes(needle) ||
                    n.summary.toLowerCase().includes(needle) ||
                    n.content.toLowerCase().includes(needle)
            );
        }
        items = [...items].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        const total = items.length;
        return { total, page, perPage, items: items.slice((page - 1) * perPage, page * perPage) };
    }

    const conditions = [];
    if (status) conditions.push(q`status = ${status}`);
    if (category) conditions.push(q`category = ${category}`);
    if (search) {
        const needle = `%${search}%`;
        conditions.push(
            q`(title ILIKE ${needle} OR summary ILIKE ${needle} OR content ILIKE ${needle})`
        );
    }
    const where = conditions.length ? q`WHERE ${q.join(conditions, " AND ")}` : q``;
    const offset = (page - 1) * perPage;

    const [rows, [{ total }]] = await Promise.all([
        q`SELECT * FROM news ${where} ORDER BY published_at DESC LIMIT ${perPage} OFFSET ${offset}`,
        q`SELECT COUNT(*)::int AS total FROM news ${where}`,
    ]);

    return { total, page, perPage, items: rows.map(rowToNews) };
}

async function getNewsById(id) {
    const q = db();
    if (!q || !(await ensureSchema())) {
        return memory().find((n) => n.id === id) || null;
    }
    const [row] = await q`SELECT * FROM news WHERE id = ${id} LIMIT 1`;
    return rowToNews(row);
}

async function createNews(input) {
    const q = db();
    if (!q || !(await ensureSchema())) {
        const list = memory();
        const item = {
            id: list.length ? Math.max(...list.map((n) => n.id)) + 1 : 1,
            views: 0,
            ...input,
        };
        list.push(item);
        return item;
    }

    const [row] = await q`INSERT INTO news
        (title, summary, content, category, source, author, published_at, status)
        VALUES (
            ${input.title}, ${input.summary}, ${input.content}, ${input.category},
            ${input.source}, ${input.author}, ${input.publishedAt}, ${input.status}
        )
        RETURNING *`;
    return rowToNews(row);
}

const EDITABLE = ["title", "summary", "content", "category", "source", "author", "status", "publishedAt"];

async function updateNews(id, patch) {
    const q = db();
    if (!q || !(await ensureSchema())) {
        const list = memory();
        const item = list.find((n) => n.id === id);
        if (!item) return null;
        for (const key of EDITABLE) {
            if (patch[key] !== undefined) item[key] = patch[key];
        }
        return item;
    }

    const current = await getNewsById(id);
    if (!current) return null;
    const next = { ...current };
    for (const key of EDITABLE) {
        if (patch[key] !== undefined) next[key] = patch[key];
    }

    const [row] = await q`UPDATE news SET
        title = ${next.title},
        summary = ${next.summary},
        content = ${next.content},
        category = ${next.category},
        source = ${next.source},
        author = ${next.author},
        status = ${next.status},
        published_at = ${next.publishedAt},
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING *`;
    return rowToNews(row);
}

async function deleteNews(id) {
    const q = db();
    if (!q || !(await ensureSchema())) {
        const list = memory();
        const idx = list.findIndex((n) => n.id === id);
        if (idx === -1) return null;
        return list.splice(idx, 1)[0];
    }
    const [row] = await q`DELETE FROM news WHERE id = ${id} RETURNING *`;
    return rowToNews(row);
}

// Increments the view counter and returns the refreshed record.
async function incrementViews(id) {
    const q = db();
    if (!q || !(await ensureSchema())) {
        const item = memory().find((n) => n.id === id);
        if (!item) return null;
        item.views = (item.views || 0) + 1;
        return item;
    }
    const [row] = await q`UPDATE news SET views = views + 1 WHERE id = ${id} RETURNING *`;
    return rowToNews(row);
}

module.exports = {
    listNews,
    getNewsById,
    createNews,
    updateNews,
    deleteNews,
    incrementViews,
    isPersistent,
};