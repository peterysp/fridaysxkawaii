const loginForm = document.querySelector("[data-login-form]");
const loginMessage = document.querySelector("[data-login-message]");
const logoutButton = document.querySelector("[data-logout]");
const sheetState = document.querySelector("[data-sheet-state]");
const sheetCount = document.querySelector("[data-sheet-count]");
const sheetTable = document.querySelector("[data-sheet-table]");
const sheetTableWrap = document.querySelector("[data-sheet-table-wrap]");
const refreshSheetButton = document.querySelector("[data-refresh-sheet]");

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request gagal");
  }

  return data;
}

async function guardAdminPage() {
  if (!sheetTable) {
    return;
  }

  try {
    await fetchJson("/api/me");
  } catch (error) {
    window.location.href = "/login.html";
    return;
  }

  loadSheetData();
}

function renderSheetTable(headers, rows) {
  sheetTable.innerHTML = "";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  headers.forEach((header) => {
    const th = document.createElement("th");
    th.textContent = header;
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  sheetTable.appendChild(thead);

  const tbody = document.createElement("tbody");

  rows.forEach((row) => {
    const tr = document.createElement("tr");

    headers.forEach((header) => {
      const td = document.createElement("td");
      td.textContent = row[header] || "";
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  sheetTable.appendChild(tbody);
}

async function loadSheetData() {
  sheetState.hidden = false;
  sheetState.textContent = "Mengambil data dari Google Sheet...";
  sheetTableWrap.hidden = true;
  sheetCount.textContent = "Memuat data";

  try {
    const data = await fetchJson("/api/sheet");

    if (!data.headers.length) {
      sheetState.textContent = "Sheet belum memiliki data.";
      sheetCount.textContent = "0 baris";
      return;
    }

    renderSheetTable(data.headers, data.rows);
    sheetState.hidden = true;
    sheetTableWrap.hidden = false;
    sheetCount.textContent = `${data.rows.length} baris`;
  } catch (error) {
    sheetState.textContent = error.message;
    sheetCount.textContent = "Belum terhubung";
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginMessage.textContent = "Memeriksa login...";

    const formData = new FormData(loginForm);

    try {
      await fetchJson("/api/login", {
        method: "POST",
        body: JSON.stringify({
          username: formData.get("username"),
          password: formData.get("password")
        })
      });

      window.location.href = "/admin.html";
    } catch (error) {
      loginMessage.textContent = error.message;
    }
  });
}

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    await fetchJson("/api/logout", { method: "POST" }).catch(() => null);
    window.location.href = "/login.html";
  });
}

if (refreshSheetButton) {
  refreshSheetButton.addEventListener("click", loadSheetData);
}

guardAdminPage();
