// Shared helpers for Vercel Serverless Functions.
// News persistence lives in ./\_db.js (Neon Postgres).

const APP_INFO = {
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

// Session token issued at login. It gates the admin API surface only — the
// login endpoint itself is guarded by ADMIN_USERNAME / ADMIN_PASSWORD.
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "cryptohub-admin-2026";

function getAppInfo() {
    return APP_INFO;
}

function checkAuth(req) {
    const auth = req.headers["authorization"] || req.headers["Authorization"];
    return auth === `Bearer ${ADMIN_TOKEN}`;
}

function handlePreflight(req, res) {
    if (req.method !== "OPTIONS") return false;
    res.status(204)
       .setHeader("Access-Control-Allow-Origin", "*")
       .setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
       .setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
       .end();
    return true;
}

function sendJSON(res, statusCode, data) {
    const body = JSON.stringify(data);
    res.status(statusCode)
       .setHeader("Access-Control-Allow-Origin", "*")
       .setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
       .setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
       .setHeader("Content-Type", "application/json; charset=utf-8");
    res.send(body);
}

module.exports = {
    getAppInfo,
    checkAuth,
    handlePreflight,
    sendJSON,
    ADMIN_TOKEN,
};