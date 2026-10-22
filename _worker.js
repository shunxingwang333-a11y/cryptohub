// CryptoHub - Cloudflare Pages Worker
// Handles all /api/* routes, static files served by Pages automatically

const SEED_NEWS = [
    { id: 1, title: "比特币突破8万美元关口，机构资金持续流入", summary: "BTC价格创近期新高，现货ETF资金净流入量再创新高，市场情绪转向乐观。", content: "比特币今日价格突破80,000美元关口，24小时涨幅超过3%。据数据显示，美国比特币现货ETF昨日净流入超过5亿美元，连续多日保持正流入态势。分析师认为，机构资金的持续流入是推动本轮上涨的主要因素。多家投行上调了比特币的年底目标价，部分预测年底有望突破10万美元。", category: "btc", source: "CryptoHub", author: "管理员", publishedAt: new Date(Date.now() - 3600000 * 2).toISOString(), status: "published", views: 1280 },
    { id: 2, title: "以太坊完成重要升级，Gas费用大幅降低", summary: "ETH网络完成技术升级，平均Gas费用下降40%，Layer2生态活跃度提升。", content: "以太坊网络于今日完成技术升级，此次升级优化了Gas计算机制，平均交易费用下降约40%。Layer2网络上的活跃地址数增长显著，Arbitrum和Optimism的日交易量均创下新高。开发者社区表示，升级后智能合约执行效率提升，用户体验得到改善。", category: "eth", source: "CryptoHub", author: "管理员", publishedAt: new Date(Date.now() - 3600000 * 5).toISOString(), status: "published", views: 856 },
    { id: 3, title: "Solana生态Meme币交易量激增，网络活跃度攀升", summary: "Solana链上Meme币交易热度持续升温，日活地址数突破新高。", content: "Solana链上Meme币交易量近日激增，多个Meme项目24小时交易量超过1亿美元。网络日活跃地址数创下新高，validators节点数量稳步增长。业内人士提醒，Meme币波动性大，投资者需注意风险。", category: "sol", source: "CryptoHub", author: "管理员", publishedAt: new Date(Date.now() - 3600000 * 8).toISOString(), status: "published", views: 642 },
    { id: 4, title: "美国SEC批准多支以太坊现货ETF", summary: "SEC正式批准以太坊现货ETF上市交易，市场反响热烈。", content: "美国证券交易委员会（SEC）正式批准首批以太坊现货ETF上市交易。此举标志着继比特币现货ETF之后，加密货币行业又一里程碑事件。分析人士预计，以太坊现货ETF将为市场带来数十亿美元的资金流入。多家资产管理公司已提交申请，包括BlackRock、Fidelity等知名机构。", category: "eth", source: "CryptoHub", author: "管理员", publishedAt: new Date(Date.now() - 3600000 * 24).toISOString(), status: "published", views: 2104 },
    { id: 5, title: "DeFi总锁仓量重回1000亿美元上方", summary: "去中心化金融协议总锁仓价值回升，多个赛道表现亮眼。", content: "据DeFiLlama数据显示，DeFi总锁仓量（TVL）重新回到1000亿美元上方。其中借贷协议和流动性质押协议增长显著。Aave、Lido等头部协议TVL均实现两位数增长。分析师认为，市场回暖和利率下降预期是推动TVL增长的主要因素。", category: "defi", source: "CryptoHub", author: "管理员", publishedAt: new Date(Date.now() - 3600000 * 30).toISOString(), status: "published", views: 430 },
    { id: 6, title: "Ripple赢得关键诉讼，XRP价格大涨", summary: "法院裁定Ripple Labs在XRP销售案件中部分胜诉，XRP应声上涨5%。", content: "美国法院裁定Ripple Labs通过交易所向散户出售XRP的行为不构成证券销售，此消息推动XRP价格大幅上涨。法院同时认定Ripple向机构投资者出售XRP构成证券销售。这一裁决为加密行业带来了更多监管明确性。", category: "xrp", source: "CryptoHub", author: "管理员", publishedAt: new Date(Date.now() - 3600000 * 48).toISOString(), status: "published", views: 1820 },
    { id: 7, title: "币安推出全新Launchpool项目，质押BNB获奖励", summary: "币安上线新一期Launchpool，用户可质押BNB、FDUSD获取新币奖励。", content: "币安宣布推出新一期Launchpool项目，用户可通过质押BNB或FDUSD参与新币挖矿。本期项目持续30天，总奖励池价值约200万美元。币安Launchpool自推出以来，已为用户分发超过5亿美元的奖励。", category: "bnb", source: "CryptoHub", author: "管理员", publishedAt: new Date(Date.now() - 3600000 * 72).toISOString(), status: "published", views: 530 },
    { id: 8, title: "NFT市场回暖，蓝筹项目地板价回升", summary: "BAYC、Pudgy Penguins等蓝筹NFT地板价上涨，市场交易量环比增长。", content: "经过长期低迷后，NFT市场出现回暖迹象。Bored Ape Yacht Club（BAYC）地板价上涨15%，Pudgy Penguins地板价上涨20%。OpenSea日交易量环比增长30%。市场分析认为，加密市场整体回暖带动了NFT板块的复苏。", category: "nft", source: "CryptoHub", author: "管理员", publishedAt: new Date(Date.now() - 3600000 * 96).toISOString(), status: "published", views: 390 },
];

const APP_INFO = {
    android: { version: "v3.2.1", downloadUrl: "#", qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://fxh.ai/download/android" },
    ios: { version: "v3.2.1", downloadUrl: "#", qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://fxh.ai/download/ios" },
    features: ["实时行情追踪，价格秒级更新", "自选币种管理，价格预警提醒", "全球交易所数据，多维度对比", "海量资讯，快讯推送不漏过", "链上数据，大户动向一目了然"],
    updateDate: new Date().toISOString(),
};

const ADMIN_TOKEN = "cryptohub-admin-2026";

// In-memory store (resets on cold start — for production use Cloudflare KV or D1)
let newsCache = null;

function getNews() {
    if (!newsCache) newsCache = JSON.parse(JSON.stringify(SEED_NEWS));
    return newsCache;
}

function saveNews(news) {
    newsCache = news;
}

function checkAuth(request) {
    const auth = request.headers.get("authorization") || request.headers.get("Authorization");
    return auth === `Bearer ${ADMIN_TOKEN}`;
}

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json; charset=utf-8",
};

function jsonResponse(statusCode, data) {
    return new Response(JSON.stringify(data), {
        status: statusCode,
        headers: CORS_HEADERS,
    });
}

async function parseBody(request) {
    try {
        return await request.json();
    } catch {
        return {};
    }
}

function getQueryParams(url) {
    const params = {};
    for (const [key, value] of url.searchParams.entries()) {
        params[key] = value;
    }
    return params;
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        const method = request.method;
        const query = getQueryParams(url);

        // Handle CORS preflight
        if (method === "OPTIONS") {
            return new Response(null, { status: 204, headers: CORS_HEADERS });
        }

        // ---- API Routes ----

        // GET /api/news — list published news
        if (path === "/api/news" && method === "GET") {
            let news = getNews().filter(n => n.status === "published");
            news.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

            if (query.category) news = news.filter(n => n.category === query.category);
            if (query.search) {
                const q = query.search.toLowerCase();
                news = news.filter(n =>
                    n.title.toLowerCase().includes(q) ||
                    n.summary.toLowerCase().includes(q) ||
                    n.content.toLowerCase().includes(q)
                );
            }

            const page = parseInt(query.page) || 1;
            const perPage = parseInt(query.perPage) || 10;
            const total = news.length;
            const items = news.slice((page - 1) * perPage, page * perPage);
            return jsonResponse(200, { total, page, perPage, items });
        }

        // GET /api/news/:id — get single news
        const newsDetailMatch = path.match(/^\/api\/news\/(\d+)$/);
        if (newsDetailMatch && method === "GET") {
            const id = parseInt(newsDetailMatch[1]);
            const news = getNews();
            const item = news.find(n => n.id === id);
            if (item) {
                item.views = (item.views || 0) + 1;
                saveNews(news);
                return jsonResponse(200, item);
            }
            return jsonResponse(404, { error: "News not found" });
        }

        // POST /api/login — admin login
        if (path === "/api/login" && method === "POST") {
            const body = await parseBody(request);
            if (body.username === "admin" && body.password === "admin123") {
                return jsonResponse(200, { token: ADMIN_TOKEN, username: "admin" });
            }
            return jsonResponse(401, { error: "用户名或密码错误" });
        }

        // GET /api/app-info
        if (path === "/api/app-info" && method === "GET") {
            return jsonResponse(200, APP_INFO);
        }

        // GET /api/coingecko/* — proxy to CoinGecko API
        if (path.startsWith("/api/coingecko/")) {
            const cgPath = path.replace("/api/coingecko/", "");
            const qs = url.search ? url.search : "";
            const cgUrl = `https://api.coingecko.com/api/v3/${cgPath}${qs}`;

            try {
                const cgResponse = await fetch(cgUrl, {
                    headers: { "Accept": "application/json", "User-Agent": "CryptoHub/1.0" },
                });
                const cgData = await cgResponse.text();
                return new Response(cgData, {
                    status: cgResponse.status,
                    headers: { ...CORS_HEADERS, "Content-Type": "application/json; charset=utf-8" },
                });
            } catch {
                return jsonResponse(502, { error: "无法连接到数据源" });
            }
        }

        // ---- Admin Routes ----

        // GET/POST /api/admin/news — list all / create
        if (path === "/api/admin/news") {
            if (!checkAuth(request) && query.token !== ADMIN_TOKEN) {
                return jsonResponse(401, { error: "未授权" });
            }

            if (method === "GET") {
                let news = getNews();
                news.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
                const page = parseInt(query.page) || 1;
                const perPage = parseInt(query.perPage) || 20;
                const total = news.length;
                const items = news.slice((page - 1) * perPage, page * perPage);
                return jsonResponse(200, { total, page, perPage, items });
            }

            if (method === "POST") {
                const news = getNews();
                const newId = news.length > 0 ? Math.max(...news.map(n => n.id)) + 1 : 1;
                const body = await parseBody(request);
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
                saveNews(news);
                return jsonResponse(201, item);
            }

            return jsonResponse(405, { error: "Method not allowed" });
        }

        // PUT/DELETE /api/admin/news/:id
        const adminNewsMatch = path.match(/^\/api\/admin\/news\/(\d+)$/);
        if (adminNewsMatch) {
            if (!checkAuth(request) && query.token !== ADMIN_TOKEN) {
                return jsonResponse(401, { error: "未授权" });
            }

            const id = parseInt(adminNewsMatch[1]);
            const news = getNews();
            const idx = news.findIndex(n => n.id === id);

            if (method === "PUT") {
                if (idx === -1) return jsonResponse(404, { error: "News not found" });
                const body = await parseBody(request);
                news[idx] = {
                    ...news[idx],
                    title: body.title !== undefined ? body.title : news[idx].title,
                    summary: body.summary !== undefined ? body.summary : news[idx].summary,
                    content: body.content !== undefined ? body.content : news[idx].content,
                    category: body.category !== undefined ? body.category : news[idx].category,
                    source: body.source !== undefined ? body.source : news[idx].source,
                    author: body.author !== undefined ? body.author : news[idx].author,
                    status: body.status !== undefined ? body.status : news[idx].status,
                    publishedAt: body.publishedAt !== undefined ? body.publishedAt : news[idx].publishedAt,
                };
                saveNews(news);
                return jsonResponse(200, news[idx]);
            }

            if (method === "DELETE") {
                if (idx === -1) return jsonResponse(404, { error: "News not found" });
                const deleted = news.splice(idx, 1);
                saveNews(news);
                return jsonResponse(200, { success: true, deleted: deleted[0] });
            }

            return jsonResponse(405, { error: "Method not allowed" });
        }

        // Unknown API route
        if (path.startsWith("/api/")) {
            return jsonResponse(404, { error: "API endpoint not found" });
        }

        // ---- Static Files ----
        // Let Cloudflare Pages handle static files automatically
        // This code only runs for /api/* routes via _routes.json
        return env.ASSETS.fetch(request);
    },
};
