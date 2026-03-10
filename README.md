# EtharaAI

A lightweight Human Resource Management System for managing employee records and tracking daily attendance.

## Tech Stack

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4  
**Backend:** Node.js, Express, TypeScript  
**Database:** MongoDB (Mongoose ODM)  
**Deployment:** Vercel (frontend) + Render (backend) + MongoDB Atlas

## Features

- Add, view, and delete employees
- Mark daily attendance (Present / Absent)
- View attendance history with date range filters
- Dashboard with summary stats (total employees, present, absent, not marked)
- Server-side validation and duplicate handling
- Responsive design with loading, empty, and error states

## Project Structure

```
├── client/              # React frontend (Vite)
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Dashboard, Employees, Attendance
│   │   ├── services/    # API layer (axios)
│   │   └── types/       # TypeScript interfaces
│   └── ...
├── server/              # Express backend
│   ├── src/
│   │   ├── config/      # DB connection
│   │   ├── controllers/ # Route handlers
│   │   ├── middleware/   # Validation, error handling
│   │   ├── models/      # Mongoose schemas
│   │   └── routes/      # API routes
│   └── ...
└── README.md
```

## Running Locally

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas connection string)

### 1. Clone the repo

```bash
git clone <repo-url>
cd EtharaAI
```

### 2. Backend setup

```bash
cd server
cp .env.example .env
# Edit .env and add your MONGODB_URI
npm install
npm run dev
```

The API will start on `http://localhost:5000`.

### 3. Frontend setup

```bash
cd client
npm install
npm run dev
```

The app will open on `http://localhost:5173`. The Vite dev server proxies `/api` requests to the backend.

## API Endpoints

| Method | Endpoint                          | Description                     |
|--------|-----------------------------------|---------------------------------|
| GET    | /api/employees                    | List all employees              |
| POST   | /api/employees                    | Create employee                 |
| GET    | /api/employees/:id                | Get employee by ID              |
| DELETE | /api/employees/:id                | Delete employee + attendance    |
| POST   | /api/attendance                   | Mark attendance                 |
| GET    | /api/attendance/employee/:empId   | Get attendance (with filters)   |
| GET    | /api/dashboard                    | Dashboard summary               |

## Assumptions & Limitations

- Single admin user, no authentication required
- Leave management, payroll, and advanced HR features are out of scope
- Attendance is tracked per calendar day (UTC)
- Employee ID is a manually entered unique string (e.g., EMP001)
