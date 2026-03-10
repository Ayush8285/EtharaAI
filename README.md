# HRMS Lite

A simple, production-ready Human Resource Management System that lets an admin manage employee records and track daily attendance. Built as a full-stack project with a React frontend and a Python (FastAPI) backend, backed by MongoDB.

The focus here was on building something clean and functional — not over-engineered, but genuinely usable as an internal HR tool.

**Live Demo:** [Frontend](https://ethara-ai-one.vercel.app)

---

## What it does

- **Employee directory** — Add employees with their ID, name, email, and department. View the full list, or delete someone (which also cleans up their attendance records).
- **Attendance tracking** — Pick an employee, select a date, and mark them as Present or Absent. The system prevents duplicate entries for the same day.
- **Dashboard** — A quick overview showing how many employees exist, who's present/absent today, and who hasn't been marked yet.
- **Date filtering** — Filter any employee's attendance history by a date range to see just the records you need.
- **Summary stats** — Each employee's attendance view shows total present days, absent days, and overall record count.

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

## How to run it locally

### Prerequisites

- **Python 3.11+** (for the backend)
- **Node.js 18+** (for the frontend)
- **MongoDB** — either a local instance or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

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

The API will be available at `http://localhost:5000`. You can also check `http://localhost:5000/docs` for the auto-generated Swagger UI.

### 3. Start the frontend

```bash
cd client
npm install
npm run dev
```

Opens at `http://localhost:5173`. The Vite dev server proxies all `/api` requests to the backend automatically.

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

## Assumptions and Limitations

- **Single admin** — There's no login or authentication. The app assumes one admin user.
- **Scope** — Leave management, payroll, role-based access, and other advanced HR features are intentionally out of scope.
- **Attendance** — Tracked per calendar day (UTC). You can't mark the same employee twice for the same date.
- **Employee ID** — A manually entered string (like `EMP001`). The system enforces uniqueness on both the ID and the email.

---

## Deployment

- **Frontend** is deployed on [Vercel](https://vercel.com) with the root directory set to `client/`.
- **Backend** is deployed on [Render](https://render.com) as a Python web service with root directory `server/`, build command `pip install -r requirements.txt`, and start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

Both the `MONGODB_URI` and `PORT` environment variables are configured on the respective platforms.
