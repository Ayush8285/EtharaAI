# HRMS Lite

A lightweight Human Resource Management System for managing employee records and tracking daily attendance. Built with React + TypeScript on the frontend and Python (FastAPI) on the backend, with MongoDB for storage.

I kept the scope tight on purpose — the goal was a clean, working app that covers the essentials without overcomplicating things.

**Live Demo:** [https://ethara-ai-one.vercel.app]

---

## Features

- **Employee directory** — Add employees with their ID, name, email, and department. View the full list, or delete someone (which also removes their attendance records).
- **Attendance tracking** — Select an employee, pick a date, and mark them as Present or Absent. The system won't let you mark the same person twice for the same day.
- **Dashboard** — Shows a quick summary: total employees, who's present/absent today, and who hasn't been marked yet.
- **Date filtering** — Filter any employee's attendance history by a date range.
- **Summary stats** — Each employee's attendance page shows their total present days, absent days, and record count.

---

## Tech Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Frontend   | React 19, TypeScript, Vite, Tailwind CSS v4   |
| Backend    | Python 3.11+, FastAPI, Motor (async MongoDB)  |
| Database   | MongoDB (Atlas for production)                |
| Deployment | Vercel (frontend) + Render (backend)          |

---

## Project Structure

```
EtharaAI/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable pieces (Layout, LoadingSpinner, EmptyState, etc.)
│   │   ├── pages/           # Dashboard, Employees, Attendance
│   │   ├── services/        # Axios-based API calls
│   │   └── types/           # Shared TypeScript interfaces
│   ├── index.html
│   └── vite.config.ts
│
├── server/                  # FastAPI backend
│   ├── app/
│   │   ├── main.py          # FastAPI app setup, CORS, lifespan events
│   │   ├── config.py        # Reads env vars via pydantic-settings
│   │   ├── database.py      # Motor (async) MongoDB connection + indexes
│   │   ├── models.py        # Pydantic request schemas with validation
│   │   └── routes/
│   │       ├── employees.py # CRUD for employee records
│   │       ├── attendance.py# Mark + query attendance
│   │       └── dashboard.py # Aggregated dashboard stats
│   └── requirements.txt
│
└── README.md
```

---

## Running locally

### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB — either local or a free [Atlas](https://www.mongodb.com/atlas) cluster

### 1. Clone the repo

```bash
git clone https://github.com/Ayush8285/EtharaAI.git
cd EtharaAI
```

### 2. Start the backend

```bash
cd server
python -m venv venv
# On Windows: venv\Scripts\activate
# On macOS/Linux: source venv/bin/activate
cp .env.example .env
# open .env and paste your MongoDB connection string
pip install -r requirements.txt
uvicorn app.main:app --reload --port 5000
```

The API runs at `http://localhost:5000`. FastAPI also gives you auto-generated docs at `http://localhost:5000/docs` which is handy for testing.

### 3. Start the frontend

```bash
cd client
npm install
npm run dev
```

Opens at `http://localhost:5173`. Vite proxies `/api` requests to the backend, so everything just works.

---

## API Endpoints

| Method | Endpoint                              | What it does                        |
|--------|---------------------------------------|-------------------------------------|
| GET    | `/api/employees`                      | List all employees                  |
| POST   | `/api/employees`                      | Add a new employee                  |
| GET    | `/api/employees/{id}`                 | Get a single employee by Mongo ID   |
| DELETE | `/api/employees/{id}`                 | Delete employee + their attendance  |
| POST   | `/api/attendance`                     | Mark attendance for a date          |
| GET    | `/api/attendance/employee/{empId}`    | Get attendance history (with optional `from`/`to` query params) |
| GET    | `/api/dashboard`                      | Dashboard summary (today's stats)   |
| GET    | `/api/health`                         | Health check                        |

---

## Assumptions & Limitations

- No login/auth — assumes a single admin user
- Leave management, payroll, roles etc. are out of scope
- Attendance is per calendar day (UTC), no duplicate entries allowed
- Employee ID is a manually entered string like `EMP001` — uniqueness is enforced on both ID and email

---

## Deployment

Frontend is on [Vercel](https://vercel.com) (root directory: `client/`). Backend is on [Render](https://render.com) as a Python web service (root directory: `server/`).

Env vars on Render: `MONGODB_URI`, `PORT`. On Vercel: `VITE_API_URL` (points to the Render backend URL).
