# FastAPI Backend for Personal Task Tracker
# ===========================================
# What this backend does:
# 1. Stores tasks in a database (SQLite - simple file-based database)
# 2. Provides endpoints (URLs) for the frontend to do CRUD

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = "sqlite:///./tasks.db"
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False}
    # https://fastapi.tiangolo.com/tutorial/sql-databases/#create-an-engine
    # 1 requests session per thread
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class TaskTable(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)

class TaskValidation(BaseModel):
    title: str = Field(min_length=3, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    completed: bool

class TaskCreate(TaskValidation):
    pass

class TaskUpdate(TaskValidation):
    title: str | None = Field(default=None, min_length=3, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    completed: bool | None = Field(default=None)

class Task(TaskValidation):
    id: int
    completed: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

app = FastAPI()
Base.metadata.create_all(bind=engine)

# ============================================
# CORS (Cross-Origin Resource Sharing)
# Browsers block requests from one domain to another for security
# CORS lets React frontend talk to FastAPI backend

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL")], # Allow requests from React's default port
    allow_credentials=True,# Allow cookies/authentication
    allow_methods=["*"], # Allow all HTTP methods (GET, POST, PUT, DELETE)
    allow_headers=["*"], # Allow all headers
)

def get_db():
    db = SessionLocal()
    try:
        yield db # hands over then closes after
    finally:
        db.close()

@app.post("/tasks/", response_model=Task)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    db_task = TaskTable(
        title=task.title,
        description=task.description,
        completed=task.completed
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.get("/tasks/", response_model=List[Task])
def get_tasks(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    tasks = db.query(TaskTable).offset(skip).limit(limit).all()
    return tasks

@app.get("/tasks/{task_id}", response_model=Task)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(TaskTable).filter(TaskTable.id == task_id).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found.")
    return task

@app.put("/tasks/{task_id}", response_model=Task)
def update_task(task_id: int, task_update: TaskUpdate, db: Session = Depends(get_db)):
    db_task = get_task(task_id, db)
    changed = False
    for field in ["title", "description", "completed"]:
        updated_val = getattr(task_update, field)
        if updated_val is not None and updated_val != getattr(db_task, field):
            setattr(db_task, field, updated_val)
            changed = True
    if changed:
        db.commit()
        db.refresh(db_task)
    return db_task

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    db_task = get_task(task_id, db)
    db.delete(db_task)
    db.commit()
    return

@app.get("/")
def root():
    return {
        "message": "Welcome to Task Tracker API!",
        "docs": "Visit http://localhost:8000/docs for interactive API documentation"
    }