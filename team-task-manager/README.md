# TaskFlow — Team Task Manager

A full-stack collaborative project & task management app with role-based access control.

## Features

- **Authentication** — JWT-based signup/login
- **Projects** — Create, manage, and delete projects
- **Team Management** — Invite members with Admin/Member roles
- **Tasks** — Create tasks with status, priority, due date, and assignee
- **Kanban Board** — Visual To Do / In Progress / Done columns
- **Dashboard** — Personal task overview and project stats

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6 |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| Deployment | Render |

---

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with REACT_APP_API_URL (e.g. http://localhost:5000/api)
npm start
```

---

## Deploying to Render

### Step 1: Create Render Account
Go tohttps://dashboard.render.com and sign up.

### Step 2: Deploy Backend

1. Click **New Project → Deploy from GitHub Repo**
2. Select the `backend` folder (or push backend separately)
3. Render auto-detects Node.js
4. Add environment variables:
   - `DATABASE_URL` — Render provides this when you add a PostgreSQL service
   - `JWT_SECRET` — any long random string
   - `NODE_ENV` — `production`
   - `FRONTEND_URL` — your frontend Render URL (set after frontend deploy)

### Step 3: Add PostgreSQL

In your Render project, click **+ New → Database → PostgreSQL**.  
Render auto-injects `DATABASE_URL` to your backend service.

### Step 4: Deploy Frontend

1. Add another service in Render from the `frontend` folder
2. Add environment variable:
   - `REACT_APP_API_URL` — your backend Render URL + `/api`
3. Render builds and deploys automatically

### Step 5: Update CORS

Go back to backend service, set `FRONTEND_URL` to your frontend Render URL.

---

## API Endpoints

### Auth
| Method | Route | Access |
|--------|-------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Private |

### Projects
| Method | Route | Access |
|--------|-------|--------|
| GET | `/api/projects` | Private |
| POST | `/api/projects` | Private |
| GET | `/api/projects/:id` | Member+ |
| PUT | `/api/projects/:id` | Admin |
| DELETE | `/api/projects/:id` | Owner |
| GET | `/api/projects/:id/members` | Member+ |
| POST | `/api/projects/:id/members` | Admin |
| DELETE | `/api/projects/:id/members/:userId` | Admin |

### Tasks
| Method | Route | Access |
|--------|-------|--------|
| GET | `/api/projects/:id/tasks` | Member+ |
| POST | `/api/projects/:id/tasks` | Member+ |
| GET | `/api/projects/:id/tasks/:taskId` | Member+ |
| PUT | `/api/projects/:id/tasks/:taskId` | Member+ |
| DELETE | `/api/projects/:id/tasks/:taskId` | Admin |

### Dashboard
| Method | Route | Access |
|--------|-------|--------|
| GET | `/api/dashboard` | Private |

---

## Role-Based Access Control

| Action | Member | Admin |
|--------|--------|-------|
| View project | ✓ | ✓ |
| Create tasks | ✓ | ✓ |
| Edit tasks | ✓ | ✓ |
| Delete tasks | ✗ | ✓ |
| Edit project | ✗ | ✓ |
| Manage members | ✗ | ✓ |
| Delete project | ✗ | Owner only |

---

## Database Schema

```sql
users (id, name, email, password, created_at)
projects (id, name, description, owner_id, created_at)
project_members (id, project_id, user_id, role, joined_at)
tasks (id, title, description, status, priority, due_date, project_id, assignee_id, created_by, created_at, updated_at)
```
