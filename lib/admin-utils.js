const crypto = require("crypto");

const sessionCookieName = "fxk_admin";
const sessionMaxAgeSeconds = 60 * 60 * 8;

function getAdminConfig() {
  const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);

  return {
    username: process.env.ADMIN_USERNAME || (isProduction ? "" : "admin"),
    password: process.env.ADMIN_PASSWORD || (isProduction ? "" : "fridaysxkawaii2026"),
    sessionSecret: process.env.ADMIN_SESSION_SECRET || (isProduction ? "" : "local-dev-secret"),
    sheetCsvUrl: process.env.GOOGLE_SHEET_CSV_URL || ""
  };
}

function sendJson(response, statusCode, payload, headers = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    ...headers
  });
  response.end(JSON.stringify(payload));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;

      if (body.length > 1024 * 1024) {
        reject(new Error("Request body too large"));
        request.destroy();
      }
    });

    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });

    request.on("error", reject);
  });
}

function base64Url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function createSessionCookie(username) {
  const { sessionSecret } = getAdminConfig();
  const expiresAt = Date.now() + sessionMaxAgeSeconds * 1000;
  const payload = base64Url(JSON.stringify({ username, expiresAt }));
  const signature = sign(payload, sessionSecret);
  const secure = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL) ? "; Secure" : "";

  return `${sessionCookieName}=${payload}.${signature}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionMaxAgeSeconds}${secure}`;
}

function clearSessionCookie() {
  return `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((cookies, cookie) => {
    const [name, ...valueParts] = cookie.trim().split("=");

    if (name) {
      cookies[name] = valueParts.join("=");
    }

    return cookies;
  }, {});
}

function getSession(request) {
  const { sessionSecret } = getAdminConfig();
  const cookies = parseCookies(request.headers.cookie);
  const token = cookies[sessionCookieName];

  if (!sessionSecret || !token || !token.includes(".")) {
    return null;
  }

  const [payload, signature] = token.split(".");
  const expectedSignature = sign(payload, sessionSecret);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));

    if (!session.expiresAt || Date.now() > session.expiresAt) {
      return null;
    }

    return session;
  } catch (error) {
    return null;
  }
}

function requireAdmin(request, response) {
  const session = getSession(request);

  if (!session) {
    sendJson(response, 401, { error: "Unauthorized" });
    return null;
  }

  return session;
}

function parseCsv(csv) {
  const rows = [];
  let row = [];
  let cell = "";
  let isQuoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const nextChar = csv[index + 1];

    if (char === '"' && isQuoted && nextChar === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      isQuoted = !isQuoted;
      continue;
    }

    if (char === "," && !isQuoted) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !isQuoted) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const [headers = [], ...dataRows] = rows.filter((item) => item.some((value) => value.trim()));

  return {
    headers,
    rows: dataRows.map((dataRow) =>
      headers.reduce((item, header, index) => {
        item[header || `Column ${index + 1}`] = dataRow[index] || "";
        return item;
      }, {})
    )
  };
}

async function fetchSheetData() {
  const { sheetCsvUrl } = getAdminConfig();

  if (!sheetCsvUrl) {
    const error = new Error("GOOGLE_SHEET_CSV_URL is not configured");
    error.statusCode = 503;
    throw error;
  }

  const response = await fetch(sheetCsvUrl);

  if (!response.ok) {
    const error = new Error(`Google Sheet responded with ${response.status}`);
    error.statusCode = 502;
    throw error;
  }

  const csv = await response.text();
  return parseCsv(csv);
}

module.exports = {
  clearSessionCookie,
  createSessionCookie,
  fetchSheetData,
  getAdminConfig,
  getSession,
  readJsonBody,
  requireAdmin,
  sendJson
};
