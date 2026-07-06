# 🎓 SmartSchool UI

A clean, Persian-first frontend for the **SmartSchool** platform. This repository contains the **UI layer only** and is meant to work alongside the main backend repository.

Built with **Vanilla JavaScript**, **HTML**, and **CSS**, this project keeps the stack simple while still providing a complete school dashboard experience for teachers and students. ✨

## 📘 Overview

SmartSchool UI is a web panel designed for a smart school system with a **right-to-left Persian interface**. After login, it connects to the backend API and displays user account data, classes, homework, attendance, scores, messages, and profile information in a unified dashboard.

## 🚀 Features

- 🔐 JWT-based login flow
- 💾 Stores `access` and `refresh` tokens in `localStorage`
- 🔄 Automatic access token refresh on `401` responses
- 🌍 Persian `RTL` interface
- 👨‍🏫 Separate dashboards for teachers and students
- 🌙 Light and dark theme support
- 👤 Profile page with identity, educational, and activity details
- 📝 Score management: create, edit, delete
- 📚 Homework management: create, edit, delete
- ✅ Attendance management: create, delete
- 💬 Message management: create, edit, delete
- 🔔 Unread message indicator for students
- 🔎 Search across scores, homework, and attendance
- 🗂️ Grouped data views by date and class
- 🗓️ Jalali date picker for homework-related forms
- ⚡ Quick teacher actions for score and attendance registration
- 🔁 Automatic dashboard reload after data changes

## 🎭 Supported Roles

### 👨‍🎓 Student

- View personal dashboard
- View active homework and tomorrow's homework
- View scores
- View attendance history
- View received messages
- View profile information

### 👨‍🏫 Teacher

- View assigned classes and lessons
- Use quick class management actions
- Create and edit student scores
- Create and edit homework
- Register attendance
- Create and edit student messages
- View activity summary and teaching stats

## 🛠️ Tech Stack

- Vanilla JavaScript
- HTML5
- CSS3
- Bootstrap `5.3.3`
- Bootstrap Icons `1.11.3`
- Servor for local development

## 🧱 Project Structure

```text
smartschool-UI/
├── index.html          # main entry point
├── install.sh          # smart installer & manager (Linux servers)
├── package.json
├── js/
│   ├── app.js          # app logic, rendering, navigation
│   ├── api.js          # API layer, auth, token management
│   ├── config.js       # backend URL and runtime config
│   ├── handlers/
│   ├── modal-managers/
│   └── vendors/
├── styles/             # page and component styles
├── images/
└── README.md
```

## 📦 Requirements

**Local development:**

- Node.js 18+ recommended
- npm

**Server deployment (via `install.sh`):**

- A Debian/Ubuntu server with root access
- The SmartSchool backend running and reachable

## ▶️ Run Locally (Development)

```bash
npm install
npm start        # serves on http://localhost:3000 with live reload
```

Other scripts:

- `npm run serve`: same as `start`
- `npm run check`: syntax-check the main JavaScript files

Point the UI at your backend by editing `js/config.js`:

```js
window.SMARTSCHOOL_CONFIG = {
  apiBaseUrl: "http://127.0.0.1:8000",
  dashboardLimit: 0
};
```

## 🧙 Server Installation — Smart Installer

The repository ships with a **transactional, menu-driven installer** for Linux servers:

```bash
sudo bash install.sh
```

### What it does

On first run it launches a **guided wizard** that asks for:

| Setting | Description |
| --- | --- |
| Backend API URL | Written into `js/config.js` |
| Dashboard limit | `0` = unlimited |
| Deploy mode | `Simple`, `Nginx`, or `Nginx + TLS` |
| Domain / Port / Email | Depending on the chosen mode |

### 🚦 Deploy modes

- **Simple** — runs the UI as a standalone `systemd` service on a port of your choice. Zero extra dependencies; great for testing.
- **Nginx** — deploys as a static production site behind Nginx with caching headers and SPA fallback.
- **Nginx + TLS** — same as above, plus a free **Let's Encrypt** HTTPS certificate with automatic HTTP→HTTPS redirect.

### ♻️ Rollback safety

Every install/reconfigure action runs inside a **transaction**. If anything fails — or you press `Ctrl+C` mid-way — the script automatically restores every file, service, and Nginx site it touched, so you can simply run it again from a clean state.

### 🧰 Management menu

After installation, running `sudo bash install.sh` again opens a management menu. **Every decision made during install can be changed later** — no need to reinstall from scratch:

1. **Change backend API URL** — rewrites `js/config.js` in place
2. **Change deploy mode** — switch between simple / nginx / TLS anytime; the script knows what to stop, remove, and start for each transition
3. **Change domain** — updates the Nginx config and re-issues the TLS certificate if needed
4. **Redeploy files** — sync the latest source and restart only what's necessary
5. **Status** — services, ports, and certificate info
6. **Logs** — follow live service or Nginx logs
7. **Uninstall** — cleanly removes the app, service, Nginx site, and settings

Settings are persisted in `/etc/smartschool-ui/install.env` and the app is deployed to `/var/www/smartschool-ui`.

## 🧠 How It Works

1. A splash/loading screen is shown first.
2. If no token exists, the user is redirected to the login view.
3. After successful login, account data is fetched from the backend.
4. The correct dashboard is rendered based on the user role.
5. All create, edit, and delete actions are sent through the API, then the dashboard is reloaded.

## 🎨 UI Highlights

- Persian-friendly `RTL` layout
- Bootstrap-based base components
- Top and bottom navigation for fast movement between sections
- Dynamic modals for CRUD actions
- Empty states for sections with no data
- Toast messages for success and error feedback
- Jalali date conversion and selection for a better local user experience

## 🧪 Development Notes

- The current main entry logic lives in `js/app.js`.
- The project uses a simple no-bundler structure, so files are loaded directly in the browser.
- Frontend and backend changes should be kept in sync.
- If the backend response contracts change, parts of `js/api.js` and `js/app.js` will likely need updates.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
