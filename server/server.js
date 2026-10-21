/**
 * CryptoHub - Backend Server
 * 
 * Provides:
 * - Static file serving (frontend pages)
 * - REST API for news (CRUD)
 * - REST API for app download info
 * - Proxy to CoinGecko API (avoids CORS issues)
 * - Simple JSON file-based data storage
 * 
 * Usage: node server.js
 * Default port: 3000
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.join(__dirname, ".."); // crypto-tracker root
const DATA_DIR = path.join(__dirname, "data");
const NEWS_FILE = path.join(DATA_DIR, "news.json");
const APP_INFO_FILE = path.join(DATA_DIR, "app_info.json");

// ========================================
// Data Storage (JSON file based)
// ========================================

function ensureDataFiles() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    
    // Initialize news file with seed data
    if (!fs.existsSync(NEWS_FILE)) {
        const seedNews = [
            {
                id: 1,
                title: "比特币突破8万美元关口，机构资金持续流入",
                summary: "BTC价格创近期新高，现货ETF资金净流入量再创新高，市场情绪转向乐观。",
                content: "比特币今日价格突破80,000美元关口，24小时涨幅超过3%。据数据显示，美国比特币现货ETF昨日净流入超过5亿美元，连续多日保持正流入态势。分析师认为，机构资金的持续流入是推动本轮上涨的主要因素。多家投行上调了比特币的年底目标价，部分预测年底有望突破10万美元。",
                category: "btc",
                source: "CryptoHub",
                author: "管理员",
                publishedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
                status: "published",
                views: 1280,
            },
            {
                id: 2,
                title: "以太坊完成重要升级，Gas费用大幅降低",
                summary: "ETH网络完成技术升级，平均Gas费用下降40%，Layer2生态活跃度提升。",
                content: "以太坊网络于今日完成技术升级，此次升级优化了Gas计算机制，平均交易费用下降约40%。Layer2网络上的活跃地址数增长显著，Arbitrum和Optimism的日交易量均创下新高。开发者社区表示，升级后智能合约执行效率提升，用户体验得到改善。",
                category: "eth",
                source: "CryptoHub",
                author: "管理员",
                publishedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
                status: "published",
                views: 856,
            },
            {
                id: 3,
                title: "Solana生态Meme币交易量激增，网络活跃度攀升",
                summary: "Solana链上Meme币交易热度持续升温，日活地址数突破新高。",
                content: "Solana链上Meme币交易量近日激增，多个Meme项目24小时交易量超过1亿美元。网络日活跃地址数创下新高， validators节点数量稳步增长。业内人士提醒，Meme币波动性大，投资者需注意风险。",
                category: "sol",
                source: "CryptoHub",
                author: "管理员",
                publishedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
                status: "published",
                views: 642,
            },
            {
                id: 4,
                title: "美国SEC批准多支以太坊现货ETF",
                summary: "SEC正式批准以太坊现货ETF上市交易，市场反响热烈。",
                content: "美国证券交易委员会（SEC）正式批准首批以太坊现货ETF上市交易。此举标志着继比特币现货ETF之后，加密货币行业又一里程碑事件。分析人士预计，以太坊现货ETF将为市场带来数十亿美元的资金流入。多家资产管理公司已提交申请，包括BlackRock、Fidelity等知名机构。",
                category: "eth",
                source: "CryptoHub",
                author: "管理员",
                publishedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
                status: "published",
                views: 2104,
            },
            {
                id: 5,
                title: "DeFi总锁仓量重回1000亿美元上方",
                summary: "去中心化金融协议总锁仓价值回升，多个赛道表现亮眼。",
                content: "据DeFiLlama数据显示，DeFi总锁仓量（TVL）重新回到1000亿美元上方。其中借贷协议和流动性质押协议增长显著。Aave、Lido等头部协议TVL均实现两位数增长。分析师认为，市场回暖和利率下降预期是推动TVL增长的主要因素。",
                category: "defi",
                source: "CryptoHub",
                author: "管理员",
                publishedAt: new Date(Date.now() - 3600000 * 30).toISOString(),
                status: "published",
                views: 430,
            },
            {
                id: 6,
                title: "Ripple赢得关键诉讼，XRP价格大涨",
                summary: "法院裁定Ripple Labs在XRP销售案件中部分胜诉，XRP应声上涨5%。",
                content: "美国法院裁定Ripple Labs通过交易所向散户出售XRP的行为不构成证券销售，此消息推动XRP价格大幅上涨。法院同时认定Ripple向机构投资者出售XRP构成证券销售。这一裁决为加密行业带来了更多监管明确性。",
                category: "xrp",
                source: "CryptoHub",
                author: "管理员",
                publishedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
                status: "published",
                views: 1820,
            },
            {
                id: 7,
                title: "币安推出全新Launchpool项目，质押BNB获奖励",
                summary: "币安上线新一期Launchpool，用户可质押BNB、FDUSD获取新币奖励。",
                content: "币安宣布推出新一期Launchpool项目，用户可通过质押BNB或FDUSD参与新币挖矿。本期项目持续30天，总奖励池价值约200万美元。币安Launchpool自推出以来，已为用户分发超过5亿美元的奖励。",
                category: "bnb",
                source: "CryptoHub",
                author: "管理员",
                publishedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
                status: "published",
                views: 530,
            },
            {
                id: 8,
                title: "NFT市场回暖，蓝筹项目地板价回升",
                summary: "BAYC、Pudgy Penguins等蓝筹NFT地板价上涨，市场交易量环比增长。",
                content: "经过长期低迷后，NFT市场出现回暖迹象。Bored Ape Yacht Club（BAYC）地板价上涨15%，Pudgy Penguins地板价上涨20%。OpenSea日交易量环比增长30%。市场分析认为，加密市场整体回暖带动了NFT板块的复苏。",
                category: "nft",
                source: "CryptoHub",
                author: "管理员",
                publishedAt: new Date(Date.now() - 3600000 * 96).toISOString(),
                status: "published",
                views: 390,
            },
        ];
        fs.writeFileSync(NEWS_FILE, JSON.stringify(seedNews, null, 2));
    }

    // Initialize app info file
    if (!fs.existsSync(APP_INFO_FILE)) {
        const appInfo = {
            android: {
                version: "v3.2.1",
                downloadUrl: "#",
                qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://fxh.ai/download/android",
            },
            ios: {
                version: "v3.2.1",
                downloadUrl: "#",
                qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://fxh.ai/download/ios",
            },
            features: [
                "实时行情追踪，价格秒级更新",
                "自选币种管理，价格预警提醒",
                "全球交易所数据，多维度对比",
                "海量资讯，快讯推送不漏过",
                "链上数据，大户动向一目了然",
            ],
            updateDate: new Date().toISOString(),
        };
        fs.writeFileSync(APP_INFO_FILE, JSON.stringify(appInfo, null, 2));
    }
}

function readNews() {
    try {
        return JSON.parse(fs.readFileSync(NEWS_FILE, "utf-8"));
    } catch {
        return [];
    }
}

function writeNews(news) {
    fs.writeFileSync(NEWS_FILE, JSON.stringify(news, null, 2));
}

function readAppInfo() {
    try {
        return JSON.parse(fs.readFileSync(APP_INFO_FILE, "utf-8"));
    } catch {
        return null;
    }
}

function writeAppInfo(info) {
    fs.writeFileSync(APP_INFO_FILE, JSON.stringify(info, null, 2));
}

// ========================================
// HTTP Helpers
// ========================================

function sendJSON(res, statusCode, data) {
    const body = JSON.stringify(data);
    res.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Content-Length": Buffer.byteLength(body),
    });
    res.end(body);
}

function sendStaticFile(res, filePath, contentType) {
    try {
        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
            sendJSON(res, 404, { error: "Not Found" });
            return;
        }
        const content = fs.readFileSync(filePath);
        res.writeHead(200, {
            "Content-Type": contentType,
            "Cache-Control": "no-cache",
        });
        res.end(content);
    } catch (err) {
        sendJSON(res, 500, { error: "Internal Server Error" });
    }
}

function getContentType(ext) {
    const types = {
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
        ".ico": "image/x-icon",
        ".woff": "font/woff",
        ".woff2": "font/woff2",
        ".ttf": "font/ttf",
    };
    return types[ext] || "application/octet-stream";
}

// Simple auth (demo only - not production secure)
const ADMIN_TOKEN = "cryptohub-admin-2026";
function checkAuth(req) {
    const auth = req.headers["authorization"];
    if (auth === `Bearer ${ADMIN_TOKEN}`) return true;
    // Also accept token as query param for simplicity
    return false;
}

// ========================================
// API Routes
// ========================================

async function handleApi(req, res, pathname, query, body) {
    const method = req.method;

    // --- News API ---
    
    // GET /api/news - list published news (public)
    if (pathname === "/api/news" && method === "GET") {
        let news = readNews().filter(n => n.status === "published");
        // Sort by publishedAt desc
        news.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        
        // Filter by category if provided
        if (query.category) {
            news = news.filter(n => n.category === query.category);
        }
        
        // Search
        if (query.search) {
            const q = query.search.toLowerCase();
            news = news.filter(n => 
                n.title.toLowerCase().includes(q) || 
                n.summary.toLowerCase().includes(q) ||
                n.content.toLowerCase().includes(q)
            );
        }
        
        // Pagination
        const page = parseInt(query.page) || 1;
        const perPage = parseInt(query.perPage) || 10;
        const total = news.length;
        const items = news.slice((page - 1) * perPage, page * perPage);
        
        sendJSON(res, 200, { total, page, perPage, items });
        return;
    }

    // GET /api/news/:id - get single news
    const newsIdMatch = pathname.match(/^\/api\/news\/(\d+)$/);
    if (newsIdMatch && method === "GET") {
        const id = parseInt(newsIdMatch[1]);
        const news = readNews();
        const item = news.find(n => n.id === id);
        if (item) {
            // Increment views
            item.views = (item.views || 0) + 1;
            writeNews(news);
            sendJSON(res, 200, item);
        } else {
            sendJSON(res, 404, { error: "News not found" });
        }
        return;
    }

    // --- Admin News API (requires auth) ---

    // GET /api/admin/news - list ALL news (including drafts)
    if (pathname === "/api/admin/news" && method === "GET") {
        if (!checkAuth(req) && query.token !== ADMIN_TOKEN) {
            sendJSON(res, 401, { error: "未授权" });
            return;
        }
        let news = readNews();
        news.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        const page = parseInt(query.page) || 1;
        const perPage = parseInt(query.perPage) || 20;
        const total = news.length;
        const items = news.slice((page - 1) * perPage, page * perPage);
        sendJSON(res, 200, { total, page, perPage, items });
        return;
    }

    // POST /api/admin/news - create news
    if (pathname === "/api/admin/news" && method === "POST") {
        if (!checkAuth(req) && query.token !== ADMIN_TOKEN) {
            sendJSON(res, 401, { error: "未授权" });
            return;
        }
        const news = readNews();
        const newId = news.length > 0 ? Math.max(...news.map(n => n.id)) + 1 : 1;
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
        writeNews(news);
        sendJSON(res, 201, item);
        return;
    }

    // PUT /api/admin/news/:id - update news
    const adminNewsIdMatch = pathname.match(/^\/api\/admin\/news\/(\d+)$/);
    if (adminNewsIdMatch && method === "PUT") {
        if (!checkAuth(req) && query.token !== ADMIN_TOKEN) {
            sendJSON(res, 401, { error: "未授权" });
            return;
        }
        const id = parseInt(adminNewsIdMatch[1]);
        const news = readNews();
        const idx = news.findIndex(n => n.id === id);
        if (idx === -1) {
            sendJSON(res, 404, { error: "News not found" });
            return;
        }
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
        writeNews(news);
        sendJSON(res, 200, news[idx]);
        return;
    }

    // DELETE /api/admin/news/:id - delete news
    if (adminNewsIdMatch && method === "DELETE") {
        if (!checkAuth(req) && query.token !== ADMIN_TOKEN) {
            sendJSON(res, 401, { error: "未授权" });
            return;
        }
        const id = parseInt(adminNewsIdMatch[1]);
        const news = readNews();
        const idx = news.findIndex(n => n.id === id);
        if (idx === -1) {
            sendJSON(res, 404, { error: "News not found" });
            return;
        }
        const deleted = news.splice(idx, 1);
        writeNews(news);
        sendJSON(res, 200, { success: true, deleted: deleted[0] });
        return;
    }

    // --- App Info API ---
    if (pathname === "/api/app-info" && method === "GET") {
        sendJSON(res, 200, readAppInfo());
        return;
    }

    if (pathname === "/api/admin/app-info" && method === "PUT") {
        if (!checkAuth(req) && query.token !== ADMIN_TOKEN) {
            sendJSON(res, 401, { error: "未授权" });
            return;
        }
        const info = { ...readAppInfo(), ...body, updateDate: new Date().toISOString() };
        writeAppInfo(info);
        sendJSON(res, 200, info);
        return;
    }

    // --- Auth API ---
    if (pathname === "/api/login" && method === "POST") {
        if (body.username === "admin" && body.password === "admin123") {
            sendJSON(res, 200, { token: ADMIN_TOKEN, username: "admin" });
        } else {
            sendJSON(res, 401, { error: "用户名或密码错误" });
        }
        return;
    }

    // --- CoinGecko Proxy (avoids CORS) ---
    if (pathname.startsWith("/api/coingecko/")) {
        const cgPath = pathname.replace("/api/coingecko/", "");
        const https = require("https");
        const cgUrl = `https://api.coingecko.com/api/v3/${cgPath}${req.url.includes("?") ? "?" + req.url.split("?")[1] : ""}`;
        
        // Make request with timeout
        const proxyReq = https.get(cgUrl, {
            headers: { "Accept": "application/json", "User-Agent": "CryptoHub/1.0" },
            timeout: 10000,
        }, (proxyRes) => {
            let data = "";
            proxyRes.on("data", chunk => data += chunk);
            proxyRes.on("end", () => {
                try {
                    const json = JSON.parse(data);
                    sendJSON(res, proxyRes.statusCode, json);
                } catch {
                    res.writeHead(proxyRes.statusCode, {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    });
                    res.end(data);
                }
            });
        });
        proxyReq.on("error", () => {
            sendJSON(res, 502, { error: "无法连接到数据源" });
        });
        proxyReq.on("timeout", () => {
            proxyReq.destroy();
            sendJSON(res, 504, { error: "数据源请求超时" });
        });
        return;
    }

    // 404
    sendJSON(res, 404, { error: "API not found" });
}

// ========================================
// Main Server
// ========================================

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", chunk => body += chunk);
        req.on("end", () => {
            if (!body) return resolve({});
            try {
                resolve(JSON.parse(body));
            } catch {
                resolve({});
            }
        });
        req.on("error", reject);
    });
}

const server = http.createServer(async (req, res) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        });
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    // --- API Routes ---
    if (pathname.startsWith("/api/")) {
        const body = ["POST", "PUT"].includes(req.method) ? await parseBody(req) : {};
        await handleApi(req, res, pathname, query, body);
        return;
    }

    // --- Static Files ---
    let filePath = pathname;
    if (filePath === "/" || filePath === "") filePath = "/index.html";
    
    // Security: prevent directory traversal
    filePath = filePath.replace(/\.\.\//g, "");
    
    const fullPath = path.join(ROOT_DIR, filePath);
    
    // Ensure file exists and is within root
    if (!fullPath.startsWith(ROOT_DIR)) {
        sendJSON(res, 403, { error: "Forbidden" });
        return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    const contentType = getContentType(ext);
    
    // For HTML files, add no-cache header
    const headers = { "Content-Type": contentType };
    if (ext === ".html" || ext === ".js" || ext === ".css") {
        headers["Cache-Control"] = "no-cache";
    }
    
    try {
        if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
            // Try index.html in directory
            const indexPath = path.join(fullPath, "index.html");
            if (fs.existsSync(indexPath)) {
                sendStaticFile(res, indexPath, "text/html; charset=utf-8");
            } else {
                sendJSON(res, 404, { error: "Not Found" });
            }
            return;
        }
        sendStaticFile(res, fullPath, contentType);
    } catch (err) {
        sendJSON(res, 500, { error: "Internal Server Error" });
    }
});

// Initialize data and start server
ensureDataFiles();
server.listen(PORT, "127.0.0.1", () => {
    console.log(`CryptoHub server running at http://127.0.0.1:${PORT}`);
    console.log(`Admin panel: http://127.0.0.1:${PORT}/admin/index.html`);
    console.log(`Admin login: username=admin, password=admin123`);
});
