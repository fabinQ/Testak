from typing import Annotated, Optional
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import SessionMaker
from models import Task, Image, Answers
from typing import Annotated
from sqlalchemy.orm import Session
from starlette.responses import StreamingResponse


app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_session():
    try:
        Session = SessionMaker()
        yield Session
    finally:
        Session.close()

@app.get("/tasks/")
def read_tasks( 
    db: Annotated[Session, Depends(get_session)],
    class_level: Optional[int] = None,
    difficulty: Optional[str] = None,
    task_type: Optional[str] = None,
    scope: Optional[str] = None,
    topic: Optional[str] = None
    ):

    query = db.query(Task)

    if class_level is not None:
        query = query.filter(Task.class_level == class_level)
    if difficulty is not None:
        query = query.filter(Task.difficulty == difficulty)
    if task_type is not None:
        query = query.filter(Task.task_type == task_type)
    if scope is not None:
        query = query.filter(Task.scope == scope)
    if topic is not None:
        query = query.filter(Task.topic == topic)

    return query.all()

@app.get("/images/{filename}")
def get_images( db: Annotated[Session, Depends(get_session)], filename: str):
    image = db.query(Image).filter(Image.filename == filename).first()

    # Jesli obraz nie istnieje, zwróć błąd 404
    if not image:
        raise HTTPException(status_code=404, detail=f"Image with id {filename} not found")
    
    # Obsługa błędu, jeśli file_data jest puste
    if not image.file_data:
        raise HTTPException(status_code=404, detail="Image data is empty.")
    
    return StreamingResponse(content=iter([image.file_data]),media_type=image.mime_type)

@app.get("/answers/{id_answers}")
def get_answers (db:Annotated[Session, Depends(get_session)], id_answers: int):
    answers = db.query(Answers).filter(Answers.task_id == id_answers).all()
    if not answers:
        raise HTTPException(status_code=404, detail="No answer to the question.")
    return answers