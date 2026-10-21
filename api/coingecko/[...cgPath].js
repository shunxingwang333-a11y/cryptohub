const https = require("https");
const { sendJSON } = require("../../_shared");

module.exports = (req, res) => {
    if (req.method === "OPTIONS") {
        res.status(204)
           .setHeader("Access-Control-Allow-Origin", "*")
           .setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
           .setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
           .end();
        return;
    }

    // req.query.cgPath is the remaining path after /api/coingecko/
    const cgPath = req.query.cgPath || "";
    const queryString = new URLSearchParams(req.query).toString();
    const qs = queryString ? "?" + queryString.replace(/^cgPath=[^&]*&?/, "") : "";
    
    const cgUrl = `https://api.coingecko.com/api/v3/${cgPath}${qs ? "?" + qs : ""}`;

    https.get(cgUrl, {
        headers: {
            "Accept": "application/json",
            "User-Agent": "CryptoHub/1.0",
        },
        timeout: 10000,
    }, (proxyRes) => {
        let data = "";
        proxyRes.on("data", chunk => data += chunk);
        proxyRes.on("end", () => {
            try {
                const json = JSON.parse(data);
                sendJSON(res, proxyRes.statusCode, json);
            } catch {
                res.status(proxyRes.statusCode)
                   .setHeader("Content-Type", "application/json")
                   .setHeader("Access-Control-Allow-Origin", "*")
                   .send(data);
            }
        });
    }).on("error", () => {
        sendJSON(res, 502, { error: "无法连接到数据源" });
    }).on("timeout", function() {
        this.destroy();
        sendJSON(res, 504, { error: "数据源请求超时" });
    });
};
