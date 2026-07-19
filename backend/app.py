from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Table, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
from typing import List
from dotenv import load_dotenv
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
import os

load_dotenv()

DEFAULT_TAG_NAMES = ["work", "school", "urgent"]
DEFAULT_TASKS = [
    {"title": "Finish Report", "description": "Wrap up the Q3 report for review.", "completed": False, "due_offset": -2, "tags": ["work", "urgent"]},
    {"title": "Submit Homework", "description": "Turn in the math assignment.", "completed": True, "due_offset": -5, "tags": ["school"]},
    {"title": "Team Standup", "description": "Daily sync with the team.", "completed": True, "due_offset": -1, "tags": ["work"]},
    {"title": "Read Chapter 4", "description": "Read for tomorrow's class.", "completed": False, "due_offset": 1, "tags": ["school"]},
    {"title": "Fix Prod Bug", "description": "Investigate the login crash reported by QA.", "completed": False, "due_offset": -1, "tags": ["work", "urgent"]},
    {"title": "Plan Weekend", "description": "Figure out weekend plans.", "completed": False, "due_offset": 3, "tags": []},
]
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 5
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str):
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict):
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

DATABASE_URL = os.getenv("DATABASE_URL")
# SQLite needs check_same_thread=False for 1 request session per thread;
# Postgres (e.g. Neon) doesn't support that option, so only pass it for SQLite.
# https://fastapi.tiangolo.com/tutorial/sql-databases/#create-an-engine
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# user
class UserTable(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now)

class UserValidation(BaseModel):
    name: str = Field(min_length=3, max_length=50)
    email: str
    password: str = Field(min_length=8)

class UserCreate(UserValidation):
    pass

class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=3, max_length=50)
    email: str | None = None
    password: str | None = Field(default=None, min_length=8)

class UserLogin(BaseModel):
    email: str
    password: str

class User(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# tag
class TagTable(Base):
    __tablename__ = "tags"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, index=True)

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
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
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

def seed_default_user():
    db = SessionLocal()
    default_users = [
        {"name": "Dummy", "email": "abc@abc.com", "password": "123abc???"},
    ]
    for user in default_users:
        if not db.query(UserTable).filter_by(email=user["email"]).first():
            new_user = (UserTable(
                name=user["name"],
                email=user["email"],
                password_hash=hash_password(user["password"])
            ))
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            for tags in DEFAULT_TAG_NAMES:
                db.add(TagTable(user_id=new_user.id, name=tags))
            db.commit()
            tag_lookup = {
                tag.name: tag
                for tag in db.query(TagTable).filter_by(user_id=new_user.id).all()
            }
            for task in DEFAULT_TASKS:
                new_task = TaskTable(
                    user_id=new_user.id,
                    title=task["title"],
                    description=task["description"],
                    completed=task["completed"],
                    due_date=datetime.now() + timedelta(days=task["due_offset"]),
                )
                for tag_name in task["tags"]:
                    new_task.tags.append(tag_lookup[tag_name])
                db.add(new_task)
            db.commit()
    db.close()

seed_default_user()

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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
def get_curr_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token.")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    user = db.query(UserTable).filter(UserTable.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found.")
    return user

def get_curr_user_id(token: str = Depends(oauth2_scheme)) -> int:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token.")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    return int(user_id)

# user
@app.post("/register", response_model=User)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(UserTable).filter(UserTable.email == user.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered.")
    curr_user = UserTable(
        name=user.name,
        email=user.email,
        password_hash=hash_password(user.password)
    )
    db.add(curr_user)
    db.commit()
    db.refresh(curr_user)
    for tag_name in DEFAULT_TAG_NAMES:
        db.add(TagTable(user_id=curr_user.id, name=tag_name))
    db.commit()
    return curr_user

@app.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    curr_user = db.query(UserTable).filter(UserTable.email == credentials.email).first()
    if not curr_user or not verify_password(credentials.password, curr_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    token = create_access_token({"sub": str(curr_user.id)})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/profile", response_model=User)
def get_profile(curr_user: UserTable = Depends(get_curr_user)):
    return curr_user

@app.put("/profile", response_model=User)
def update_profile(user_update: UserUpdate, curr_user: UserTable = Depends(get_curr_user), db: Session = Depends(get_db)):
    isChanged = False
    for field in ["name", "email", "password"]:
        updated_val = getattr(user_update, field)
        if updated_val is not None:
            if field == "email" and updated_val != getattr(curr_user, field):
                clash = db.query(UserTable).filter(
                    UserTable.email == updated_val,
                    UserTable.id != curr_user.id
                ).first()
                if clash:
                    raise HTTPException(status_code=409, detail="Email already in use.")
            if field != "password":
                setattr(curr_user, field, updated_val)
            else:
                curr_user.password_hash = hash_password(updated_val)
            isChanged = True
    if isChanged:
        db.commit()
        db.refresh(curr_user)
    return curr_user

# task
@app.post("/tasks/", response_model=Task)
def create_task(task: TaskCreate, curr_user_id: int = Depends(get_curr_user_id), db: Session = Depends(get_db)):
    curr_task = TaskTable(
        user_id=curr_user_id,
        title=task.title,
        description=task.description,
        completed=task.completed,
        due_date=task.due_date
    )
    db.add(curr_task)
    db.commit()
    db.refresh(curr_task)
    return curr_task

@app.get("/tasks/", response_model=List[Task])
def get_tasks(skip: int = 0, limit: int = 100, curr_user_id: int = Depends(get_curr_user_id), db: Session = Depends(get_db)):
    tasks = db.query(TaskTable).filter(TaskTable.user_id == curr_user_id).offset(skip).limit(limit).all()
    return tasks

@app.get("/tasks/{task_id}", response_model=Task)
def get_task(task_id: int, curr_user_id: int = Depends(get_curr_user_id), db: Session = Depends(get_db)):
    task = db.query(TaskTable).filter(
        TaskTable.id == task_id,
        TaskTable.user_id == curr_user_id
    ).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found.")
    return task

@app.put("/tasks/{task_id}", response_model=Task)
def update_task(task_id: int, task_update: TaskUpdate, curr_user_id: int = Depends(get_curr_user_id), db: Session = Depends(get_db)):
    curr_task = get_task(task_id, curr_user_id, db)
    isChanged = False
    for field in ["title", "description", "completed", "due_date"]:
        updated_val = getattr(task_update, field)
        if updated_val is not None and updated_val != getattr(curr_task, field):
            setattr(curr_task, field, updated_val)
            isChanged = True
    if isChanged:
        db.commit()
        db.refresh(curr_task)
    return curr_task

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, curr_user_id: int = Depends(get_curr_user_id), db: Session = Depends(get_db)):
    curr_task = get_task(task_id, curr_user_id, db)
    db.delete(curr_task)
    db.commit()
    return

# tag
@app.post("/tags/", response_model=Tag)
def create_tag(tag: TagCreate, curr_user_id: int = Depends(get_curr_user_id), db: Session = Depends(get_db)):
    existing = db.query(TagTable).filter(TagTable.name == tag.name, TagTable.user_id == curr_user_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Tag name already exists.")
    curr_tag = TagTable(
        user_id=curr_user_id,
        name=tag.name
    )
    db.add(curr_tag)
    db.commit()
    db.refresh(curr_tag)
    return curr_tag

@app.get("/tags/", response_model=List[Tag])
def get_tags(curr_user_id: int = Depends(get_curr_user_id), db: Session = Depends(get_db)):
    return db.query(TagTable).filter(TagTable.user_id == curr_user_id).all()

@app.get("/tags/{tag_id}", response_model=Tag)
def get_tag(tag_id: int, curr_user_id: int = Depends(get_curr_user_id), db: Session = Depends(get_db)):
    tag = db.query(TagTable).filter(
        TagTable.id == tag_id,
        TagTable.user_id == curr_user_id
    ).first()
    if tag is None:
        raise HTTPException(status_code=404, detail="Tag not found.")
    return tag

@app.put("/tags/{tag_id}", response_model=Tag)
def update_tag(tag_id: int, tag_update: TagUpdate, curr_user_id: int = Depends(get_curr_user_id), db: Session = Depends(get_db)):
    curr_tag = get_tag(tag_id, curr_user_id, db)
    if tag_update.name is not None and tag_update.name != curr_tag.name:
        clash = db.query(TagTable).filter(
            TagTable.name == tag_update.name,
            TagTable.user_id == curr_user_id,
            TagTable.id != tag_id
        ).first()
        if clash:
            raise HTTPException(status_code=409, detail="Tag name already exists.")
        curr_tag.name = tag_update.name
        db.commit()
        db.refresh(curr_tag)
    return curr_tag

@app.delete("/tags/{tag_id}")
def delete_tag(tag_id: int, curr_user_id: int = Depends(get_curr_user_id), db: Session = Depends(get_db)):
    curr_tag = get_tag(tag_id, curr_user_id, db)
    db.delete(curr_tag)
    db.commit()
    return

# task and tag
@app.post("/tasks/{task_id}/tags", response_model=Task)
def add_tags_to_task(task_id: int, tag_ids: List[int], curr_user_id: int = Depends(get_curr_user_id), db: Session = Depends(get_db)):
    curr_task = get_task(task_id, curr_user_id, db)
    tags = db.query(TagTable).filter(TagTable.id.in_(tag_ids), TagTable.user_id == curr_user_id).all()
    for tag in tags:
        if tag not in curr_task.tags:
            curr_task.tags.append(tag)
    db.commit()
    db.refresh(curr_task)
    return curr_task

@app.delete("/tasks/{task_id}/tags", response_model=Task)
def remove_tags_from_task(task_id: int, tag_ids: List[int], curr_user_id: int = Depends(get_curr_user_id), db: Session = Depends(get_db)):
    curr_task = get_task(task_id, curr_user_id, db)
    tags = db.query(TagTable).filter(TagTable.id.in_(tag_ids), TagTable.user_id == curr_user_id).all()
    for tag in tags:
        if tag in curr_task.tags:
            curr_task.tags.remove(tag)
    db.commit()
    db.refresh(curr_task)
    return curr_task

@app.get("/")
def root():
    return {
        "message": "Welcome to Task Tracker API!",
        "docs": "Visit http://localhost:8000/docs for interactive API documentation"
    }