from dataclasses import dataclass, replace
from typing import Annotated
from fastapi import FastAPI, Depends, Header, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from database import SessionMaker
from models import Task, Image, Answer
from schemas import FacetsOut, FacetValue, TaskDetailOut, TaskListOut
from sqlalchemy import func, or_
from sqlalchemy.orm import Session


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

def is_blank(column):
    return or_(column.is_(None), column == "")


def matches_or_blank(column, values: list):
    """FR-7/7a: puste pole (NULL lub "") pasuje do każdego filtra."""
    return or_(column.in_(values), is_blank(column))


def text_contains(column, phrase: str):
    """FR-2: fraza jako podciąg, bez względu na wielkość liter (także ą, ł, ż...).

    LIKE/lower() w SQLite znają tylko ASCII, więc obie strony przechodzą przez
    casefold: kolumna przez funkcję SQL z database.py, fraza w Pythonie.
    Znaki % i _ we frazie są escapowane — mają znaczyć dosłownie siebie.
    """
    escaped = (
        phrase.casefold().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    )
    return func.casefold(column).like(f"%{escaped}%", escape="\\")


def is_original():
    """Bliźniaki są symetryczne (A<->B); oryginałem jest strona z niższym id.

    Strona z wyższym id nie trafia do banku ani puli losowania —
    staje się treścią grupy B po włączeniu dwóch grup.
    """
    return or_(Task.twin_task_id.is_(None), Task.twin_task_id > Task.id)


@dataclass
class TaskFilters:
    """Wspólne filtry dla GET /tasks i GET /tasks/facets (zależność FastAPI)."""

    class_level: Annotated[int | None, Query()] = None
    difficulty: Annotated[list[str] | None, Query()] = None
    scope: Annotated[list[str] | None, Query()] = None
    topic: Annotated[list[str] | None, Query()] = None
    task_type: Annotated[str | None, Query()] = None
    source: Annotated[str | None, Query()] = None
    q: Annotated[str | None, Query(max_length=200)] = None

    def without(self, field: str) -> "TaskFilters":
        return replace(self, **{field: None})

    def apply(self, query):
        query = query.filter(is_original())
        if self.class_level is not None:
            # Zadanie bez klasy też pasuje — do czasu uzupełnienia danych w banku
            query = query.filter(
                or_(Task.class_level == self.class_level, Task.class_level.is_(None))
            )
        if self.difficulty:
            query = query.filter(matches_or_blank(Task.difficulty, self.difficulty))
        if self.scope:
            query = query.filter(matches_or_blank(Task.scope, self.scope))
        if self.topic:
            query = query.filter(Task.topic.in_(self.topic))
        if self.task_type is not None:
            query = query.filter(Task.task_type == self.task_type)
        if self.source is not None:
            query = query.filter(Task.source == self.source)
        if self.q and self.q.strip():
            query = query.filter(text_contains(Task.content_text, self.q.strip()))
        return query


@app.get("/tasks/", response_model=TaskListOut)
def read_tasks(
    db: Annotated[Session, Depends(get_session)],
    filters: Annotated[TaskFilters, Depends()],
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    query = filters.apply(db.query(Task))

    total = query.count()
    # Stałe sortowanie — bez niego stronicowanie mogłoby gubić/powtarzać zadania
    items = query.order_by(Task.id).offset(offset).limit(limit).all()
    return TaskListOut(items=items, total=total)


def facet_counts(db: Session, filters: TaskFilters, field: str) -> list[FacetValue]:
    """Liczniki jednego filtra przy aktualnie zaznaczonych POZOSTAŁYCH filtrach.

    Własny filtr pola jest pomijany: inaczej po zaznaczeniu "łatwe" pozostałe
    trudności pokazywałyby 0 i nie dałoby się ocenić, co da ich dodanie.
    Lista wartości zależy tylko od klasy, więc pozycje nie znikają przy
    zawężaniu — mogą mieć licznik 0.
    """
    column = getattr(Task, field)
    blank_matches = field in ("class_level", "difficulty", "scope")

    # Lista klas nie może zależeć od wybranej klasy — inaczej zostałaby jedna
    value_scope = None if field == "class_level" else filters.class_level
    values = (
        TaskFilters(class_level=value_scope)
        .apply(db.query(column))
        .filter(~is_blank(column))
        .distinct()
        .order_by(column)
    )
    narrowed = filters.without(field).apply(db.query(Task))
    counts = dict(
        narrowed.filter(~is_blank(column))
        .with_entities(column, func.count(Task.id))
        .group_by(column)
        .all()
    )
    # FR-3: zadania z pustym polem liczą się w każdym koszyku
    blank = narrowed.filter(is_blank(column)).count() if blank_matches else 0
    return [
        FacetValue(value=str(value), count=counts.get(value, 0) + blank)
        for (value,) in values
    ]


# UWAGA: musi być zadeklarowane PRZED /tasks/{task_id},
# inaczej "facets" zostałoby potraktowane jako task_id
@app.get("/tasks/facets", response_model=FacetsOut)
def read_facets(
    db: Annotated[Session, Depends(get_session)],
    filters: Annotated[TaskFilters, Depends()],
):
    return FacetsOut(
        total=filters.apply(db.query(Task)).count(),
        bank_total=db.query(Task).filter(is_original()).count(),
        **{
            field: facet_counts(db, filters, field)
            for field in (
                "class_level", "difficulty", "scope", "topic", "task_type", "source",
            )
        },
    )


@app.get("/tasks/{task_id}", response_model=TaskDetailOut)
def read_task(db: Annotated[Session, Depends(get_session)], task_id: int):
    # Bez is_original(): ukryty bliźniak też musi być dostępny po id (treść grupy B)
    task = db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    return task


# Bank jest tylko do odczytu, więc obrazki praktycznie się nie zmieniają.
# Doba świeżości + ETag: po tym czasie przeglądarka pyta, a my odpowiadamy 304.
IMAGE_CACHE_CONTROL = "private, max-age=86400"


def etag_matches(if_none_match: str | None, etag: str) -> bool:
    if not if_none_match:
        return False
    candidates = [c.strip().removeprefix("W/") for c in if_none_match.split(",")]
    return "*" in candidates or etag in candidates


@app.get("/images/{filename}")
def get_images(
    db: Annotated[Session, Depends(get_session)],
    filename: str,
    if_none_match: Annotated[str | None, Header()] = None,
):
    # Najpierw same metadane — przy trafieniu w cache nie czytamy BLOB-a
    meta = (
        db.query(Image.id, Image.file_size, Image.created_at, Image.mime_type)
        .filter(Image.filename == filename)
        .first()
    )
    if meta is None:
        raise HTTPException(status_code=404, detail=f"Image {filename} not found")

    etag = f'"{meta.id}-{meta.file_size}-{meta.created_at}"'
    headers = {"ETag": etag, "Cache-Control": IMAGE_CACHE_CONTROL}
    if etag_matches(if_none_match, etag):
        return Response(status_code=304, headers=headers)

    file_data = db.query(Image.file_data).filter(Image.id == meta.id).scalar()
    if not file_data:
        raise HTTPException(status_code=404, detail="Image data is empty.")

    return Response(content=file_data, media_type=meta.mime_type, headers=headers)

@app.get("/answers/{id_answers}")
def get_answers (db:Annotated[Session, Depends(get_session)], id_answers: int):
    answers = db.query(Answer).filter(Answer.task_id == id_answers).all()
    if not answers:
        raise HTTPException(status_code=404, detail="No answer to the question.")
    return answers