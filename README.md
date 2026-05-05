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
├── index.html
├── package.json
├── js/
│   ├── app.js
│   ├── api.js
│   ├── config.js
│   ├── handlers/
│   ├── modal-managers/
│   └── vendors/
├── styles/
├── images/
└── README.md
```

Important files:

- `index.html`: main entry point
- `js/app.js`: app logic, page rendering, navigation, and UI behavior
- `js/api.js`: API layer, authentication, and token management
- `js/config.js`: backend URL and runtime config
- `styles/`: page and component styles

## 📦 Requirements

- Node.js 18+ recommended
- npm
- The SmartSchool backend running in a separate repository

## ⚙️ Installation

```powershell
npm install
```

## ▶️ Run Locally

Make sure the backend project is already running, then start the frontend:

```powershell
npm start
```

Or:

```powershell
npm run serve
```

By default, the app runs on port `3000` using `servor` with auto reload enabled. 🔥

## 🔧 Backend Configuration

Connection settings live in `js/config.js`:

```js
window.SMARTSCHOOL_CONFIG = {
  apiBaseUrl: "http://127.0.0.1:8000",
  dashboardLimit: 0
};
```

Config options:

- `apiBaseUrl`: base URL of the backend
- `dashboardLimit`: limit value passed to the account dashboard endpoint

If your backend runs on a different host or port, update this file.

## 🔗 Backend Dependency

This repository is **not a standalone full product**. It depends on the SmartSchool backend for real data and business logic.

Backend repository: https://github.com/EXE88/smartschool

The current frontend is designed around these endpoints:

- `POST /api/token/`
- `POST /api/token/refresh/`
- `GET /api/accounts/me/`
- `POST /api/scores/`
- `PATCH /api/scores/:id/`
- `DELETE /api/scores/:id/`
- `POST /api/homeworks/`
- `PATCH /api/homeworks/:id/`
- `DELETE /api/homeworks/:id/`
- `POST /api/attendances/`
- `DELETE /api/attendances/:id/`
- `POST /api/comments/`
- `PATCH /api/comments/:id/`
- `DELETE /api/comments/:id/`

## 🔐 Authentication Flow

- User signs in through the login form
- `access` and `refresh` tokens are saved in `localStorage`
- Authenticated requests use `Authorization: Bearer <token>`
- If the access token expires, the app automatically requests a new one using the refresh token

## 📜 npm Scripts

```json
{
  "start": "servor . index.html 3000 --reload",
  "serve": "servor . index.html 3000 --reload",
  "check": "node --check js/api.js && node --check js/app.js"
}
```

Usage:

- `npm start`: run the project locally
- `npm run serve`: same as `start`
- `npm run check`: check syntax for the main JavaScript files

## 🎨 UI Highlights

- Persian-friendly `RTL` layout
- Bootstrap-based base components
- Top and bottom navigation for fast movement between sections
- Dynamic modals for CRUD actions
- Empty states for sections with no data
- Toast messages for success and error feedback
- Jalali date conversion and selection for a better local user experience

## 🧠 How It Works

1. A splash/loading screen is shown first.
2. If no token exists, the user is redirected to the login view.
3. After successful login, account data is fetched from the backend.
4. The correct dashboard is rendered based on the user role.
5. All create, edit, and delete actions are sent through the API, then the dashboard is reloaded.

## 🧪 Development Notes

- The current main entry logic lives in `js/app.js`.
- The project uses a simple no-bundler structure, so files are loaded directly in the browser.
- Frontend and backend changes should be kept in sync.
- If the backend response contracts change, parts of `js/api.js` and `js/app.js` will likely need updates.

## 🚀 Production Deployment Manager

This repository includes a production helper script for Linux servers:

```bash
sudo bash scripts/production-manager.sh
```

The script provides a colored interactive menu for:

- Installing Nginx, Certbot, and required server packages
- Deploying SmartSchool UI as a static production release
- Configuring the backend API URL in `js/config.js`
- Creating an Nginx site configuration
- Enabling HTTPS with Let's Encrypt and Certbot
- Deploying new releases
- Rolling back to older releases
- Reloading Nginx
- Viewing status and logs
- Uninstalling the deployed frontend

The production deployment uses timestamped releases under `/var/www/smartschool-ui/releases` and points `/var/www/smartschool-ui/current` to the active release. Rollback only changes the active symlink and reloads Nginx.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
