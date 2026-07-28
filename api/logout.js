const { clearSessionCookie, sendJson } = require("../lib/admin-utils");

module.exports = async function logout(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  sendJson(response, 200, { ok: true }, { "Set-Cookie": clearSessionCookie() });
};
