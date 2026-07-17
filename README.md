# 📝 Personal Task Tracker
A simple full-stack web application for managing personal tasks. Built with **FastAPI** (Python) backend and **React** (JavaScript) frontend.  
🔗 **Live Demo:** https://task-tracker-vfe.vercel.app  
Developed on **Vercel** and the database runs on **Neon** (PostgreSQL).
## Development Methodology & Transparency
This project is the result of a **"learning by doing"** approach to explore FastAPI and React. Throughout development, AI was used as a discussion partner to guide learning, allowing me to discuss ideas, evaluate the suggestions, and modify the code to fit my needs. This collaborative workflow made the learning process both efficient and highly hands-on.

# Project Overview
## Frontend (React, using Vite)
- React components and JSX
- State management with hooks (useState, useEffect)
- API calls with axios
- Event handling
- Conditional rendering
- Form handling
- Styling with Tailwind CSS utility classes
## Backend (FastAPI/Python)
- REST API design (GET, POST, PUT, DELETE)
- Database operations with SQLAlchemy
- Pydantic data validation
- CORS configuration
- Async/await patterns

## Structure
```
task-tracker/
├── backend/
│   ├── app.py               # FastAPI application (all backend code)
│   ├── tasks.db             # SQLite database (created automatically)
│   ├── requirements.txt     # Python dependencies
│   ├── .env                 # Environment variables (not committed)
│   └── .env.example         # Template for .env
│
└── frontend/
    ├── index.html           # HTML template
    ├── vite.config.js       # Vite + Tailwind configuration
    ├── package.json         # Node.js dependencies
    ├── eslint.config.js     # ESLint configuration
    ├── .env                 # Environment variables (not committed)
    ├── .env.example         # Template for .env
    ├── public/
    │   └── favicon.svg
    └── src/
        ├── main.jsx           # React entry point
        ├── index.css          # Global styles + Tailwind directives
        ├── App.jsx            # Root component (shell / temporary render of Tasks)
        ├── api/
        │   └── client.js      # axios instance + API_BASE_URL
        ├── components/
        │   ├── Navbar.jsx
        │   ├── TaskForm.jsx
        │   ├── TaskList.jsx
        │   ├── TagForm.jsx
        │   └── TagFilterBar.jsx
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Profile.jsx
        │   └── Tasks.jsx      # task list + forms (moved from App.jsx)
        └── styles/
            └── formStyles.js  # shared Tailwind class strings for forms
```

# 🚀 Quick Start Guide
Open Command Prompt
## Step 1: Install Backend
```
cd backend
pip install -r requirements.txt
```
## Step 2: Install Frontend
```
cd frontend
npm install
```
## Step 3: Set Up Environment Variables
Copy `.env.example` to `.env` in both `backend/` and `frontend/`, then fill in the values.

# Start The App
Open two Command Prompt windows.
## Step 1: Start Backend Server 
```

```
## Step 2: Start Frontend
```
cd frontend
npm run dev
```

# 🎮 Test the App
## Guest Preview
Open the app without logging in to see a read-only preview: 3 sample tasks (one ongoing, one overdue, one completed) and 3 sample tags (work, school, urgent). Add/edit/delete is disabled in this mode.
## Demo Account
A demo account is seeded automatically the first time the backend runs:
- **Email:** abc@abc.com
- **Password:** 123abc???
It comes pre-loaded with the same 3 default tags and 6 sample tasks (mixed ongoing/overdue/completed).
## Try These Actions
1. **Add a task**: Click "Add Task", fill the form and attach tags if needed, click "Add Task"
2. **Complete it**: Click "✅ Done" button
3. **Delete it**: Click "🗑️ Delete" button
4. **Undo completion**: Click "↩️ Undo" on a completed task
5. **Edit a task**: Click "✏️ Edit", update the fields, click "Update Task"
6. **Add a tag**: Click "Add Tag", fill the form, click "Add Tag"
7. **Attach tags**: While adding/editing a task, search and select tag(s)
8. **Filter tasks**: Use the status buttons (All / Ongoing / Overdue / Completed) or click a tag to filter
9. **Manage tags**: Click "Manage Tags", then ✏️ edit or × delete a tag