const { sendJSON, ADMIN_TOKEN } = require("./_shared");

module.exports = (req, res) => {
    if (req.method === "OPTIONS") {
        res.status(204)
           .setHeader("Access-Control-Allow-Origin", "*")
           .setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
           .setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
           .end();
        return;
    }

    if (req.method !== "POST") {
        return sendJSON(res, 405, { error: "Method not allowed" });
    }

    const { username, password } = req.body || {};

    if (username === "admin" && password === "admin123") {
        sendJSON(res, 200, { token: ADMIN_TOKEN, username: "admin" });
    } else {
        sendJSON(res, 401, { error: "用户名或密码错误" });
    }
};
