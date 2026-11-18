# AI Study Assistant

A web app that helps students study from their own notes. Upload a PDF, Word, or text file, ask questions and get answers with the page they came from, and generate a study guide with a summary, key terms, definitions, and practice questions.

> B.Tech CSE third-year project

## Features

- **Sign up and sign in** with accounts saved on a small Python server
- **Personal dashboard** with study stats, progress, and a fresh, empty start for every new user
- **AI Study Chat** that answers from your uploaded notes and shows the source file and page
- **Study guide generator** that builds a summary, key terms, definitions, and practice questions (with a "Show answer" toggle), and can be copied or downloaded
- **File upload** by drag and drop, the 📎 button, or the study guide box (PDF, DOCX, TXT, MD, up to 10 MB)
- **Admin page** listing all users, their login counts, and recent login activity, with CSV download
- **Light and dark mode**, and a layout that works on phones

## Tech stack

| Part | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript (no framework) |
| Backend | Python 3 standard library (`http.server`), no installs needed |
| Storage | `users.json` and `logins.json` on the server; chat and notes in the browser's localStorage |
| File reading | [pdf.js](https://mozilla.github.io/pdf.js/) for PDF and [mammoth](https://github.com/mwilliamson/mammoth.js) for DOCX (loaded from cdnjs) |
| Passwords | Salted PBKDF2-SHA256 hashing |

## Project structure

```
├── index.html      Dashboard page
├── style.css       Dashboard styles
├── script.js       Dashboard logic: chat, upload, study guide
├── docs.js         Reads files, searches them, builds study guides
├── auth.js         Session and per-user data helpers
├── login.html      Login and sign-up page
├── login.css       Login page styles
├── login.js        Login page logic (talks to the server)
├── admin.html      Admin page
├── admin.css       Admin page styles
├── admin.js        Admin page logic
├── server.py       Backend: serves the site, signup, login, admin API
└── README.md
```

`users.json` and `logins.json` are created automatically when the first user signs up.

## How to run

1. Install [Python 3.8 or newer](https://www.python.org/downloads/).
2. Open a terminal in the project folder.
3. Start the server:
   ```
   python server.py
   ```
   On some systems use `python3 server.py`.
4. Open **http://localhost:8000** in your browser.

Do not open the HTML files by double-clicking them. Sign up and sign in only work when the page is opened through the server.

To try the app without making an account, click **Continue as demo user** on the login page.

### Admin page

Open **http://localhost:8000/admin.html** and enter the admin key.

The default key is `change-me`. Set your own before sharing the project:

```
# Mac / Linux
ADMIN_KEY=mysecret python server.py

# Windows (Command Prompt)
set ADMIN_KEY=mysecret
python server.py
```

### Let others on your Wi-Fi try it

```
HOST=0.0.0.0 python server.py
```

Then they open `http://YOUR-COMPUTER-IP:8000`.

## How it works

1. **Login:** the browser sends the email and password to `server.py`, which stores a salted hash in `users.json` and records each attempt in `logins.json`.
2. **Reading files:** when you upload a file, the text is extracted in your browser and split into short passages of about 600 characters.
3. **Answering questions:** the chat scores each passage by how well its words match your question (keyword matching with TF-IDF-style weighting) and shows the best sentences with their source.
4. **Study guide:** the generator picks the most important sentences, the most frequent key terms, and sentences that define a concept, then turns them into practice questions.

## Limitations

- Answers and guides are **extracted from your notes**, not written by an AI model. They work best on notes written in clear sentences, and less well on slides, tables, or bullet lists.
- **Scanned PDFs** (photos of pages) have no text to read. Use text-based PDFs.
- Reading PDF and DOCX files needs an **internet connection** to load the reader libraries.
- Chat history and uploaded notes are saved in the **browser**, so they do not follow a user to another browser or device.
- The server uses JSON files and has no login-attempt limit or HTTPS. It is suitable for a project demo, not for a public website.
- Quiz Center, Flashcards, Study Planner, Progress, and Settings are shown in the menu but are not built yet.

## Future work

- Connect an LLM (for example the Claude API) so answers and study guides are written in full sentences from the retrieved passages (RAG)
- Move to a real database such as PostgreSQL and add token-based login
- Build the Quiz Center, Flashcards, and Study Planner, and update the dashboard stats from real activity
- Add OCR for scanned PDFs
- Deploy online on a host that runs Python, such as Render or Railway

## Author

Abhinav Gupta, B.Tech CSE (Third Year), Meerut Institute of Engineering and Technology
