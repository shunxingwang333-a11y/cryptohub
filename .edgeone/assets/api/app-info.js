const { getAppInfo, sendJSON } = require("./_shared");

module.exports = (req, res) => {
    if (req.method === "OPTIONS") {
        res.status(204)
           .setHeader("Access-Control-Allow-Origin", "*")
           .setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
           .setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
           .end();
        return;
    }

    if (req.method !== "GET") {
        return sendJSON(res, 405, { error: "Method not allowed" });
    }

    sendJSON(res, 200, getAppInfo());
};
