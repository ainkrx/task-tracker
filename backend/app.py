from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Table, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List
from dotenv import load_dotenv
import os

load_dotenv()

# SQLite
# DATABASE_URL = "sqlite:///./tasks.db"
# engine = create_engine(
#     DATABASE_URL,
#     # https://fastapi.tiangolo.com/tutorial/sql-databases/#create-an-engine
#     # 1 request session per thread
#     connect_args={"check_same_thread": False}
# )
# neon
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# tag
class TagTable(Base):
    __tablename__ = "tags"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

# https://docs.sqlalchemy.org/en/20/orm/basic_relationships.html#many-to-many
task_tags = Table(
    "task_tags",
    Base.metadata,
    Column("task_id", Integer, ForeignKey("tasks.id"), primary_key=True),
    Column("tag_id",  Integer, ForeignKey("tags.id"), primary_key=True),
)

class TagValidation(BaseModel):
    name: str = Field(min_length=3, max_length=10)

class TagCreate(TagValidation):
    pass

class TagUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=3, max_length=10) 

class Tag(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

# task
class TaskTable(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    tags = relationship("TagTable", secondary=task_tags, backref="tasks")
    completed = Column(Boolean, default=False)
    due_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.now)

class TaskValidation(BaseModel):
    title: str = Field(min_length=3, max_length=15)
    description: str | None = Field(default=None, max_length=100)
    completed: bool
    due_date: datetime

class TaskCreate(TaskValidation):
    pass

class TaskUpdate(TaskValidation):
    title: str | None = Field(default=None, min_length=3, max_length=15)
    description: str | None = Field(default=None, max_length=100)
    completed: bool | None = Field(default=None)
    due_date: datetime | None = Field(default=None)

class Task(TaskValidation):
    id: int
    due_date: datetime
    tags: List[Tag] = []
    completed: bool
    created_at: datetime

    class Config:
        from_attributes = True

app = FastAPI()
Base.metadata.create_all(bind=engine)

def seed_default_tags():
    db = SessionLocal()
    for name in ["work", "school"]:
        if not db.query(TagTable).filter_by(name=name).first():
            db.add(TagTable(name=name))
    db.commit()
    db.close()

seed_default_tags()

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

# task
@app.post("/tasks/", response_model=Task)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    db_task = TaskTable(
        title=task.title,
        description=task.description,
        completed=task.completed,
        due_date=task.due_date
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
    task = db.query(TaskTable).filter(
        TaskTable.id == task_id
    ).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found.")
    return task

@app.put("/tasks/{task_id}", response_model=Task)
def update_task(task_id: int, task_update: TaskUpdate, db: Session = Depends(get_db)):
    db_task = get_task(task_id, db)
    changed = False
    for field in ["title", "description", "completed", "due_date"]:
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

# tag
@app.post("/tags/", response_model=Tag)
def create_tag(tag: TagCreate, db: Session = Depends(get_db)):
    existing = db.query(TagTable).filter(
        TagTable.name == tag.name
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Tag name already exists.")
    db_tag = TagTable(
        name=tag.name
    )
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag

@app.get("/tags/", response_model=List[Tag])
def get_tags(db: Session = Depends(get_db)):
    return db.query(TagTable).all()

@app.get("/tags/{tag_id}", response_model=Tag)
def get_tag(tag_id: int, db: Session = Depends(get_db)):
    tag = db.query(TagTable).filter(
        TagTable.id == tag_id
    ).first()
    if tag is None:
        raise HTTPException(status_code=404, detail="Tag not found.")
    return tag

@app.put("/tags/{tag_id}", response_model=Tag)
def update_tag(tag_id: int, tag_update: TagUpdate, db: Session = Depends(get_db)):
    db_tag = get_tag(tag_id, db)
    if tag_update.name is not None and tag_update.name != db_tag.name:
        clash = db.query(TagTable).filter(
            TagTable.name == tag_update.name,
            TagTable.id != tag_id
        ).first()
        if clash:
            raise HTTPException(status_code=409, detail="Tag name already exists.")
        db_tag.name = tag_update.name
        db.commit()
        db.refresh(db_tag)
    return db_tag

@app.delete("/tags/{tag_id}")
def delete_tag(tag_id: int, db: Session = Depends(get_db)):
    db_tag = get_tag(tag_id, db)
    db.delete(db_tag)
    db.commit()
    return

# task and tag
@app.post("/tasks/{task_id}/tags", response_model=Task)
def add_tags_to_task(task_id: int, tag_ids: List[int], db: Session = Depends(get_db)):
    db_task = get_task(task_id, db)
    tags = db.query(TagTable).filter(TagTable.id.in_(tag_ids)).all()
    for tag in tags:
        if tag not in db_task.tags:
            db_task.tags.append(tag)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.delete("/tasks/{task_id}/tags", response_model=Task)
def remove_tags_from_task(task_id: int, tag_ids: List[int], db: Session = Depends(get_db)):
    db_task = get_task(task_id, db)
    tags = db.query(TagTable).filter(TagTable.id.in_(tag_ids)).all()
    for tag in tags:
        if tag in db_task.tags:
            db_task.tags.remove(tag)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.get("/")
def root():
    return {
        "message": "Welcome to Task Tracker API!",
        "docs": "Visit http://localhost:8000/docs for interactive API documentation"
    }
