const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
let users = [];

$("keyform").addEventListener("submit", async e => {
  e.preventDefault();
  $("msg").textContent = "";
  try {
    const res = await fetch("/api/admin/users", { headers: { "X-Admin-Key": $("key").value } });
    const data = await res.json();
    if (!res.ok) { $("msg").textContent = data.error || "Could not load data."; return; }
    users = data.users;
    $("count").textContent = "(" + users.length + ")";
    $("users").tBodies[0].innerHTML = users.length
      ? users.map(u => `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${esc(u.created)}</td><td>${u.logins}</td><td>${esc(u.last_login || "–")}</td></tr>`).join("")
      : '<tr><td colspan="5">No users yet.</td></tr>';
    $("hist").tBodies[0].innerHTML = data.history.length
      ? data.history.map(h => `<tr><td>${esc(h.time)}</td><td class="${h.event === "failed" ? "failed" : ""}">${esc(h.event)}</td><td>${esc(h.email)}</td><td>${esc(h.ip)}</td><td>${esc(h.browser)}</td></tr>`).join("")
      : '<tr><td colspan="5">No activity yet.</td></tr>';
    $("csv").disabled = !users.length;
  } catch (err) {
    $("msg").textContent = "Can’t reach the server. Start it with “python server.py” and open this page at http://localhost:8000/admin.html.";
  }
});

// Spreadsheet programs run text starting with = + - @ as formulas, so those get a leading apostrophe.
const cell = v => { v = String(v); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };
$("csv").onclick = () => {
  const rows = [["Name", "Email", "Signed up", "Logins", "Last login"], ...users.map(u => [u.name, u.email, u.created, u.logins, u.last_login])];
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([rows.map(r => r.map(cell).join(",")).join("\n")], { type: "text/csv" }));
  a.download = "users.csv";
  a.click();
  URL.revokeObjectURL(a.href);
};
