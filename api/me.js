const { getSession, sendJson } = require("../lib/admin-utils");

module.exports = async function me(request, response) {
  const session = getSession(request);

  if (!session) {
    sendJson(response, 401, { authenticated: false });
    return;
  }

  sendJson(response, 200, { authenticated: true, username: session.username });
};
