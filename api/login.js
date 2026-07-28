const {
  createSessionCookie,
  getAdminConfig,
  readJsonBody,
  sendJson
} = require("../lib/admin-utils");

module.exports = async function login(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  const { username: expectedUsername, password: expectedPassword } = getAdminConfig();

  if (!expectedUsername || !expectedPassword) {
    sendJson(response, 503, { error: "Admin login is not configured" });
    return;
  }

  try {
    const { username, password } = await readJsonBody(request);

    if (username !== expectedUsername || password !== expectedPassword) {
      sendJson(response, 401, { error: "Username atau password salah" });
      return;
    }

    sendJson(response, 200, { ok: true }, { "Set-Cookie": createSessionCookie(username) });
  } catch (error) {
    sendJson(response, 400, { error: "Format request tidak valid" });
  }
};
