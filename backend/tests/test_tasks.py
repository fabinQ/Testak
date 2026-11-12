"""GET /tasks: filtry wielowartościowe, reguła pustych pól (FR-7/7a), stronicowanie."""
from fastapi.testclient import TestClient
from sqlalchemy import func, or_

from database import SessionMaker
from main import app, is_original
from models import Task

client = TestClient(app)


def is_blank(column):
    return or_(column.is_(None), column == "")


def class_or_blank(class_level: int):
    """Zadanie bez klasy pasuje do każdego filtra klasy."""
    return or_(Task.class_level == class_level, Task.class_level.is_(None))


def test_blank_class_level_matches_class_filter():
    assert count_tasks(Task.class_level.is_(None)) > 0
    assert count_tasks(class_or_blank(4)) > count_tasks(Task.class_level == 4)


def count_tasks(*conditions) -> int:
    """Liczy zadania widoczne w banku (bez ukrytej strony pary bliźniaków)."""
    with SessionMaker() as db:
        return db.query(func.count(Task.id)).filter(is_original(), *conditions).scalar()


def test_response_shape_and_default_limit():
    body = client.get("/tasks/").json()
    assert set(body) == {"items", "total"}
    assert body["total"] == count_tasks()
    assert len(body["items"]) == 50


def test_limit_does_not_change_total():
    body = client.get("/tasks/", params={"class_level": 4, "limit": 5}).json()
    assert len(body["items"]) == 5
    assert body["total"] == count_tasks(class_or_blank(4))


def test_offset_pages_do_not_overlap():
    first = client.get("/tasks/", params={"limit": 10}).json()["items"]
    second = client.get("/tasks/", params={"limit": 10, "offset": 10}).json()["items"]
    first_ids = [t["id"] for t in first]
    second_ids = [t["id"] for t in second]
    assert first_ids == sorted(first_ids)
    assert not set(first_ids) & set(second_ids)
    assert min(second_ids) > max(first_ids)


def test_limit_out_of_range_is_rejected():
    assert client.get("/tasks/", params={"limit": 0}).status_code == 422
    assert client.get("/tasks/", params={"limit": 201}).status_code == 422
    assert client.get("/tasks/", params={"offset": -1}).status_code == 422


def test_difficulty_filter_includes_blank():
    body = client.get("/tasks/", params={"difficulty": "łatwe", "limit": 200}).json()
    expected = count_tasks(or_(Task.difficulty == "łatwe", is_blank(Task.difficulty)))
    assert body["total"] == expected
    # Reguła ma realny efekt: w banku są zadania z pustą trudnością
    assert expected > count_tasks(Task.difficulty == "łatwe")
    assert all(t["difficulty"] in ("łatwe", None, "") for t in body["items"])


def test_difficulty_multi_value():
    body = client.get(
        "/tasks/", params={"difficulty": ["łatwe", "trudne"], "limit": 200}
    ).json()
    expected = count_tasks(
        or_(Task.difficulty.in_(["łatwe", "trudne"]), is_blank(Task.difficulty))
    )
    assert body["total"] == expected
    assert all(t["difficulty"] != "średnie" for t in body["items"])


def test_scope_filter_includes_blank():
    body = client.get("/tasks/", params={"scope": "rozszerzony"}).json()
    expected = count_tasks(or_(Task.scope == "rozszerzony", is_blank(Task.scope)))
    assert body["total"] == expected
    assert expected > count_tasks(Task.scope == "rozszerzony")


def test_topic_filter_is_exact_and_multi_value():
    with SessionMaker() as db:
        topics = [
            row[0]
            for row in db.query(Task.topic)
            .filter(Task.topic.isnot(None), Task.topic != "")
            .distinct()
            .limit(2)
        ]
    assert len(topics) == 2
    body = client.get("/tasks/", params={"topic": topics, "limit": 200}).json()
    assert body["total"] == count_tasks(Task.topic.in_(topics))
    # Temat NIE ma reguły pustego pola
    assert all(t["topic"] in topics for t in body["items"])


def test_filters_combine_with_and():
    params = {"class_level": 1, "task_type": "zamknięte", "difficulty": "trudne"}
    body = client.get("/tasks/", params=params).json()
    expected = count_tasks(
        class_or_blank(1),
        Task.task_type == "zamknięte",
        or_(Task.difficulty == "trudne", is_blank(Task.difficulty)),
    )
    assert body["total"] == expected
    assert all(
        t["class_level"] in (1, None) and t["task_type"] == "zamknięte" for t in body["items"]
    )


def test_unknown_filter_value_returns_only_blank():
    body = client.get("/tasks/", params={"difficulty": "nie-ma-takiej"}).json()
    assert body["total"] == count_tasks(is_blank(Task.difficulty))


def test_hidden_twins_are_not_listed():
    with SessionMaker() as db:
        all_rows = db.query(func.count(Task.id)).scalar()
        pairs = (
            db.query(func.count(Task.id)).filter(Task.twin_task_id > Task.id).scalar()
        )
    body = client.get("/tasks/", params={"limit": 200}).json()
    # Z każdej pary znika dokładnie jedna strona
    assert body["total"] == all_rows - pairs
    assert pairs > 0
    assert all(
        t["twin_task_id"] is None or t["twin_task_id"] > t["id"] for t in body["items"]
    )
