"""Smoke testy: API wstaje, baza jest pod absolutną ścieżką, modele zgadzają się ze schematem banku."""
from fastapi.testclient import TestClient

from database import DB_PATH
from main import app
from models import Task

client = TestClient(app)


def test_db_path_is_absolute_and_exists():
    assert DB_PATH.is_absolute()
    assert DB_PATH.exists(), "brak backend/tasks.db"


def test_tasks_endpoint_returns_rows():
    res = client.get("/tasks/", params={"class_level": 4})
    assert res.status_code == 200
    rows = res.json()["items"]
    assert rows and all(r["class_level"] == 4 for r in rows)


def test_task_relationships_load():
    from database import SessionMaker

    with SessionMaker() as db:
        task = db.query(Task).join(Task.answers).first()
        assert task is not None
        assert task.answers[0].task_id == task.id
