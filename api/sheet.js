const { fetchSheetData, requireAdmin, sendJson } = require("../lib/admin-utils");

module.exports = async function sheet(request, response) {
  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  if (!requireAdmin(request, response)) {
    return;
  }

  try {
    const data = await fetchSheetData();
    sendJson(response, 200, data);
  } catch (error) {
    sendJson(response, error.statusCode || 500, { error: error.message });
  }
};
