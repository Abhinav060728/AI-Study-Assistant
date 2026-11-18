#!/usr/bin/env python3
"""Small backend for the AI Study Assistant. No installs needed (Python 3.8+).

Run:      python server.py
Open:     http://localhost:8000
Stores:   users.json   (every account: name, email, salted password hash, signup time)
          logins.json  (every signup / login / failed attempt with time, IP and browser)
Admin:    http://localhost:8000/admin.html  (needs the ADMIN_KEY below)
"""
import hashlib
import hmac
import json
import os
import re
import secrets
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
USERS_FILE = os.path.join(ROOT, "users.json")
LOGINS_FILE = os.path.join(ROOT, "logins.json")
ADMIN_KEY = os.environ.get("ADMIN_KEY", "change-me")   # set your own: ADMIN_KEY=mysecret python server.py
HOST = os.environ.get("HOST", "127.0.0.1")            # use HOST=0.0.0.0 to let others on your Wi-Fi connect
PORT = int(os.environ.get("PORT", "8000"))
PRIVATE_FILES = {"users.json", "logins.json", "server.py"}  # never served to the browser
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
LOCK = threading.Lock()


def now():
    return time.strftime("%Y-%m-%d %H:%M:%S")


def read_json(path, default):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return default


def write_json(path, data):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    os.replace(tmp, path)


def hash_password(password, salt_hex):
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), 200_000).hex()


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    # ---------- helpers ----------
    def send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def read_body(self):
        try:
            size = min(int(self.headers.get("Content-Length", 0)), 10_000)
            return json.loads(self.rfile.read(size) or b"{}")
        except (ValueError, json.JSONDecodeError):
            return {}

    def record(self, email, name, event):
        """Add one line to logins.json. Call while holding LOCK."""
        history = read_json(LOGINS_FILE, [])
        history.append({
            "time": now(), "event": event, "email": email, "name": name,
            "ip": self.client_address[0], "browser": self.headers.get("User-Agent", "")[:120],
        })
        write_json(LOGINS_FILE, history[-5000:])

    # ---------- routes ----------
    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/api/admin/users":
            return self.admin_users()
        if os.path.basename(path) in PRIVATE_FILES or "/." in path:
            return self.send_error(404)
        return super().do_GET()

    def list_directory(self, path):  # no folder listings
        self.send_error(404)
        return None

    def do_POST(self):
        path = self.path.split("?")[0]
        data = self.read_body()
        if path == "/api/register":
            return self.register(data)
        if path == "/api/login":
            return self.login(data)
        return self.send_json(404, {"error": "Not found."})

    def register(self, d):
        name = str(d.get("name", "")).strip()[:80]
        email = str(d.get("email", "")).strip().lower()[:120]
        password = str(d.get("password", ""))
        if len(name) < 2:
            return self.send_json(400, {"error": "Enter your full name."})
        if not EMAIL_RE.match(email):
            return self.send_json(400, {"error": "Enter a valid email address."})
        if len(password) < 8:
            return self.send_json(400, {"error": "Use a password with at least 8 characters."})
        with LOCK:
            users = read_json(USERS_FILE, {})
            if email in users:
                return self.send_json(409, {"error": "An account with this email already exists. Sign in instead."})
            salt = secrets.token_hex(16)
            users[email] = {"name": name, "salt": salt, "hash": hash_password(password, salt), "created": now()}
            write_json(USERS_FILE, users)
            self.record(email, name, "signup")
        return self.send_json(201, {"name": name})

    def login(self, d):
        email = str(d.get("email", "")).strip().lower()[:120]
        password = str(d.get("password", ""))
        with LOCK:
            user = read_json(USERS_FILE, {}).get(email)
            ok = bool(user) and hmac.compare_digest(hash_password(password, user["salt"]), user["hash"])
            self.record(email, user["name"] if user else "", "login" if ok else "failed")
        if not ok:
            return self.send_json(401, {"error": "Incorrect email or password. Check them and try again."})
        return self.send_json(200, {"name": user["name"]})

    def admin_users(self):
        if not hmac.compare_digest(self.headers.get("X-Admin-Key", ""), ADMIN_KEY):
            return self.send_json(401, {"error": "Wrong admin key."})
        users = read_json(USERS_FILE, {})
        history = read_json(LOGINS_FILE, [])
        rows = []
        for email, u in users.items():
            mine = [h for h in history if h["email"] == email and h["event"] == "login"]
            rows.append({"name": u["name"], "email": email, "created": u["created"],
                         "logins": len(mine), "last_login": mine[-1]["time"] if mine else ""})
        return self.send_json(200, {"users": rows, "history": history[-200:][::-1]})


if __name__ == "__main__":
    if ADMIN_KEY == "change-me":
        print("WARNING: using the default admin key. Start with ADMIN_KEY=yourSecret to change it.")
    print(f"Server running at http://{'localhost' if HOST == '127.0.0.1' else HOST}:{PORT}  (Ctrl+C to stop)")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
