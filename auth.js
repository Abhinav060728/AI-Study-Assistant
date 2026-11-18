/* Shared login helpers, used by login.html and index.html.
   DEMO ONLY: accounts live in the browser (localStorage). For a real product,
   replace these functions with calls to your backend (e.g. POST /api/login). */
const Auth = (() => {
  const SESSION = "sa_session";
  const USERS = "sa_users";

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION) || sessionStorage.getItem(SESSION) || "null");
    } catch (e) {
      return null;
    }
  }

  function setSession(user, remember) {
    localStorage.removeItem(SESSION);
    sessionStorage.removeItem(SESSION);
    (remember ? localStorage : sessionStorage).setItem(SESSION, JSON.stringify(user));
  }

  function logout() {
    localStorage.removeItem(SESSION);
    sessionStorage.removeItem(SESSION);
    location.href = "login.html";
  }

  // Call at the top of any page that needs a logged-in user.
  function requireLogin() {
    if (!getSession()) location.replace("login.html");
  }

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS) || "{}");
    } catch (e) {
      return {};
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS, JSON.stringify(users));
  }

  // Passwords are never stored as plain text. SHA-256 is used when the browser allows it.
  async function hash(text) {
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
    }
    return "b64:" + btoa(unescape(encodeURIComponent(text)));
  }

  // ---------- Per-user dashboard data ----------
  const DEMO_EMAIL = "demo@studyassistant.app";

  // A brand-new account starts with nothing.
  function emptyData() {
    return {
      hours: 0, hoursChange: "", quiz: null, quizChange: "", streak: 0, done: 0, total: 12, notifs: 0,
      progress: { overall: 0, notes: 0, quizzes: 0, plan: 0, topics: 0 },
      week: [0, 0, 0, 0, 0, 0, 0], chat: [], file: ""
    };
  }

  // The demo user keeps the sample numbers so you can show a filled-in dashboard.
  function sampleData() {
    return {
      hours: 12.5, hoursChange: "+20%", quiz: 85, quizChange: "+5%", streak: 7, done: 8, total: 12, notifs: 2,
      progress: { overall: 78, notes: 90, quizzes: 75, plan: 70, topics: 80 },
      week: [45, 62, 58, 50, 42, 55, 68],
      chat: [
        { t: "Explain deadlock in operating systems", c: "u" },
        { t: "Deadlock is a situation where two or more processes are waiting indefinitely for resources held by each other.", c: "a" }
      ],
      file: ""
    };
  }

  function saveData(email, data) {
    localStorage.setItem("sa_data:" + email, JSON.stringify(data));
  }

  function loadData(email) {
    try {
      const raw = localStorage.getItem("sa_data:" + email);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* fall through to defaults */ }
    const d = email === DEMO_EMAIL ? sampleData() : emptyData();
    saveData(email, d);
    return d;
  }

  return { getSession, setSession, logout, requireLogin, getUsers, saveUsers, hash, emptyData, loadData, saveData };
})();