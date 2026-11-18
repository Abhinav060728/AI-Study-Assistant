const $ = id => document.getElementById(id);
const DASHBOARD = "index.html";

// Already signed in? Go straight to the dashboard.
if (Auth.getSession()) location.replace(DASHBOARD);

let mode = "signin"; // "signin" or "signup"

function setMode(m) {
  mode = m;
  const up = m === "signup";
  $("tabIn").setAttribute("aria-selected", String(!up));
  $("tabUp").setAttribute("aria-selected", String(up));
  $("nameField").hidden = !up;
  $("title").textContent = up ? "Create your account" : "Welcome back";
  $("sub").textContent = up ? "Start studying smarter in a minute." : "Sign in to continue studying.";
  $("submit").textContent = up ? "Create account" : "Sign in";
  $("password").autocomplete = up ? "new-password" : "current-password";
  showError("");
}

function showError(msg, field) {
  const e = $("error");
  e.textContent = msg;
  e.hidden = !msg;
  ["name", "email", "password"].forEach(id => $(id).classList.remove("bad"));
  if (field) $(field).classList.add("bad");
  if (field) $(field).focus();
}

$("tabIn").onclick = () => setMode("signin");
$("tabUp").onclick = () => setMode("signup");

$("toggle").onclick = () => {
  const show = $("password").type === "password";
  $("password").type = show ? "text" : "password";
  $("toggle").textContent = show ? "Hide" : "Show";
  $("toggle").setAttribute("aria-label", show ? "Hide password" : "Show password");
};

function finish(user) {
  Auth.setSession(user, $("remember").checked);
  location.href = DASHBOARD;
}

$("form").addEventListener("submit", async e => {
  e.preventDefault();
  const name = $("name").value.trim();
  const email = $("email").value.trim().toLowerCase();
  const password = $("password").value;

  if (mode === "signup" && name.length < 2) return showError("Enter your full name.", "name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showError("Enter a valid email address.", "email");
  if (mode === "signup" && password.length < 8) return showError("Use a password with at least 8 characters.", "password");
  if (!password) return showError("Enter your password.", "password");

  $("submit").disabled = true;
  try {
    const res = await fetch("/api/" + (mode === "signup" ? "register" : "login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showError(data.error || "Something went wrong. Try again.", mode === "signup" ? "email" : "password");
      return;
    }
    if (mode === "signup") Auth.saveData(email, Auth.emptyData());
    finish({ name: data.name, email });
  } catch (err) {
    showError("Can’t reach the server. Start it with “python server.py”, then open http://localhost:8000.");
  } finally {
    $("submit").disabled = false;
  }
});

$("demo").onclick = () => finish({ name: "Abhinav Gupta", email: "demo@studyassistant.app" });
