# TaskFlow — Project Management App

A full-stack project management web application built with **React.js**, **Express.js**, and **MySQL**. Supports authentication, project & team management, task assignment, and role-based access control (Admin/Member).

## 🔗 Live Demo

**[https://ethara-project-production-449b.up.railway.app](https://ethara-project-production-449b.up.railway.app)**

## ✨ Features

- **User Authentication** — Secure signup & login with JWT
- **Role-Based Access** — Admin and Member roles with granular permissions
- **Project Management** — Create, edit, and delete projects
- **Team Collaboration** — Invite members to projects via email
- **Task Tracking** — Create tasks with status (Todo / In Progress / Done), priority (Low / Medium / High), due dates, and assignees
- **Dashboard** — Overview of all tasks, stats by status, and overdue task alerts
- **Responsive UI** — Works on desktop and mobile

## 🛠️ Tech Stack

| Layer      | Technology             |
|-----------|------------------------|
| Frontend  | React.js, React Router, Axios |
| Backend   | Node.js, Express.js    |
| Database  | MySQL                  |
| Auth      | JWT + bcrypt           |
| Validation | express-validator     |
| Deployment | Railway              |

## 📁 Folder Structure

```
├── backend/
│   ├── src/
│   │   ├── config/         # Database connection & setup
│   │   ├── controllers/    # Route handlers (auth, projects, tasks, dashboard)
│   │   ├── middleware/     # JWT auth & role-based guards
│   │   ├── routes/         # Express route definitions
│   │   └── app.js          # Server entry point
│   ├── schema.sql          # MySQL table definitions
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/            # Axios instance configuration
│   │   ├── components/     # Shared layout components
│   │   ├── context/        # Auth context (React Context API)
│   │   └── pages/          # Login, Signup, Dashboard, Projects, ProjectDetail
│   └── package.json
│
├── railway.toml            # Railway deployment configuration
└── package.json            # Root scripts
```

## 🗄️ Database Schema

| Table | Purpose |
|-------|---------|
| `users` | Stores user accounts with hashed passwords and roles |
| `projects` | Projects created by admins |
| `project_members` | Many-to-many mapping between users and projects |
| `tasks` | Tasks with status, priority, assignee, and due date |

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/auth/me` | Get authenticated user info |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Get all projects (scoped by role) |
| POST | `/api/projects` | Create a new project |
| GET | `/api/projects/:id` | Get project details + members |
| PUT | `/api/projects/:id` | Update project (Admin only) |
| DELETE | `/api/projects/:id` | Delete project (Admin only) |
| POST | `/api/projects/:id/members` | Add member by email |
| DELETE | `/api/projects/:id/members/:uid` | Remove member |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/project/:projectId` | Get all tasks in a project |
| POST | `/api/tasks/project/:projectId` | Create task (Admin only) |
| PUT | `/api/tasks/:id` | Update task (Admin or assignee) |
| DELETE | `/api/tasks/:id` | Delete task (Admin only) |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get stats, overdue tasks, my tasks |

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js v16+
- MySQL installed and running

### Setup

```bash
# Clone the repository
git clone https://github.com/Mahesh8899p/Ethara-Project.git
cd Ethara-Project

# Install backend dependencies
cd backend
npm install

# Create .env file
cp .env.example .env
# Update .env with your local MySQL credentials

# Setup database tables
npm run db:setup

# Install frontend dependencies
cd ../frontend
npm install
```

### Run

```bash
# Start backend (from /backend)
npm run dev

# Start frontend (from /frontend — in a new terminal)
npm start
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

## 🌐 Deployment (Railway)

This app is deployed on [Railway](https://railway.app) with:
- **Node.js service** — serves both the Express API and the React production build
- **MySQL service** — managed database instance

### Environment Variables (Railway)

| Variable | Value |
|----------|-------|
| `PORT` | 5000 |
| `DB_HOST` | (from MySQL service) |
| `DB_USER` | root |
| `DB_PASSWORD` | (from MySQL service) |
| `DB_NAME` | railway |
| `DB_PORT` | 3306 |
| `JWT_SECRET` | (your secret) |
| `NODE_ENV` | production |

## 🔐 Role-Based Access Control

| Action | Admin | Member |
|--------|-------|--------|
| Create project | ✅ | ✅ |
| Edit/Delete project | ✅ | ❌ |
| Add/Remove members | ✅ | ❌ |
| Create task | ✅ | ❌ |
| Update task | ✅ | ✅ (if assigned) |
| Delete task | ✅ | ❌ |
| View dashboard | ✅ | ✅ |

## 👤 Author

**Mahesh Chandra Pandey**

- GitHub: [@Mahesh8899p](https://github.com/Mahesh8899p)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
