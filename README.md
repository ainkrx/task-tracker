# 📝 Personal Task Tracker
A simple full-stack web application for managing personal tasks. Built with **FastAPI** (Python) backend and **React** (JavaScript) frontend.
## Development Methodology & Transparency
This project is the result of a **"learning by doing"** approach to explore FastAPI and React. Throughout development, AI was used as a discussion partner to guide learning, allowing me to discuss ideas, evaluate the suggestions, and modify the code to fit my needs. This collaborative workflow made the learning process both efficient and highly hands-on.

---
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
│   ├── main.py              # FastAPI application (all backend code)
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
    ├── .env.                # Environment variables (not committed)
    ├── .env.example         # Template for .env
    ├── public/
    │   └── favicon.svg
    └── src/
        ├── main.jsx         # React entry point
        ├── index.css        # Global styles + Tailwind directives
        └── App.jsx          # Main React component
```

---
# 🚀 Quick Start Guide
Open Command Prompt
## Step 1: Install Backend
cd backend
pip install -r requirements.txt
## Step 2: Install Frontend
cd frontend
npm install
## Step 3: Set Up Environment Variables
Copy `.env.example` to `.env` in both `backend/` and `frontend/`, then fill in the values.

---
# Start The App
Open two Command Prompt windows.
## Step 1: Start Backend Server 
cd backend
python -m uvicorn main:app --reload
✅ Should see "Uvicorn running on http://127.0.0.1:8000"
## Step 2: Start Frontend
cd frontend
npm run dev
✅ Check terminal for the local URL (usually http://localhost:5173)

---
# 🎮 Test the App
1. **Add a task**: Type "Learn FastAPI" and click "Add Task"
2. **Complete it**: Click "✅ Complete" button
3. **Delete it**: Click "🗑️ Delete" button
4. **View API docs**: Open http://localhost:8000/docs