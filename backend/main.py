from typing import Annotated
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from database import SessionMaker
from models import Task, Image, Answer
from schemas import TaskListOut
from sqlalchemy import or_
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
    db = SessionMaker()
    try:
        yield db
    finally:
        db.close()

def matches_or_blank(column, values: list[str]):
    """FR-7/7a: puste pole (NULL lub "") pasuje do każdego filtra."""
    return or_(column.in_(values), column.is_(None), column == "")


def is_original():
    """Bliźniaki są symetryczne (A<->B); oryginałem jest strona z niższym id.

    Strona z wyższym id nie trafia do banku ani puli losowania —
    staje się treścią grupy B po włączeniu dwóch grup.
    """
    return or_(Task.twin_task_id.is_(None), Task.twin_task_id > Task.id)


def apply_task_filters(
    query,
    class_level: int | None,
    difficulty: list[str] | None,
    scope: list[str] | None,
    topic: list[str] | None,
    task_type: str | None,
    source: str | None,
):
    query = query.filter(is_original())
    if class_level is not None:
        query = query.filter(Task.class_level == class_level)
    if difficulty:
        query = query.filter(matches_or_blank(Task.difficulty, difficulty))
    if scope:
        query = query.filter(matches_or_blank(Task.scope, scope))
    if topic:
        query = query.filter(Task.topic.in_(topic))
    if task_type is not None:
        query = query.filter(Task.task_type == task_type)
    if source is not None:
        query = query.filter(Task.source == source)
    return query


@app.get("/tasks/", response_model=TaskListOut)
def read_tasks(
    db: Annotated[Session, Depends(get_session)],
    class_level: Annotated[int | None, Query()] = None,
    difficulty: Annotated[list[str] | None, Query()] = None,
    scope: Annotated[list[str] | None, Query()] = None,
    topic: Annotated[list[str] | None, Query()] = None,
    task_type: Annotated[str | None, Query()] = None,
    source: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    query = apply_task_filters(
        db.query(Task), class_level, difficulty, scope, topic, task_type, source
    )

    total = query.count()
    # Stałe sortowanie — bez niego stronicowanie mogłoby gubić/powtarzać zadania
    items = query.order_by(Task.id).offset(offset).limit(limit).all()
    return TaskListOut(items=items, total=total)

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
    answers = db.query(Answer).filter(Answer.task_id == id_answers).all()
    if not answers:
        raise HTTPException(status_code=404, detail="No answer to the question.")
    return answers