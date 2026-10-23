const { sendJSON, ADMIN_TOKEN } = require("./_shared");

// Credentials come from environment variables (set in Vercel dashboard),
// so no password is ever committed to the repository.
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "wladmin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

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

    const passwordOk =
        ADMIN_PASSWORD !== "" && password === ADMIN_PASSWORD;
    const usernameOk = username === ADMIN_USERNAME;

    if (usernameOk && passwordOk) {
        sendJSON(res, 200, { token: ADMIN_TOKEN, username: ADMIN_USERNAME });
    } else {
        sendJSON(res, 401, { error: "用户名或密码错误" });
    }
};