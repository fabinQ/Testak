"""GET /tasks/facets (liczniki, FR-3) i GET /tasks/{id} (zadanie z odpowiedziami)."""
from fastapi.testclient import TestClient
from sqlalchemy import func, or_

from database import SessionMaker
from main import app, is_blank, is_original
from models import Answer, Task

client = TestClient(app)


def count_tasks(*conditions) -> int:
    with SessionMaker() as db:
        return db.query(func.count(Task.id)).filter(is_original(), *conditions).scalar()


def as_dict(facet: list[dict]) -> dict[str, int]:
    return {row["value"]: row["count"] for row in facet}


def test_facets_route_is_not_captured_by_task_id():
    res = client.get("/tasks/facets")
    assert res.status_code == 200
    assert set(res.json()) == {
        "total", "bank_total", "class_level",
        "difficulty", "scope", "topic", "task_type", "source",
    }


def test_class_facet_lists_all_classes_even_when_one_is_selected():
    base = client.get("/tasks/facets").json()["class_level"]
    selected = client.get("/tasks/facets", params={"class_level": 2}).json()["class_level"]
    assert [r["value"] for r in base] == ["1", "2", "3", "4"]
    assert selected == base
    # Licznik klasy = total listy po jej wybraniu (zadanie bez klasy też się liczy)
    for row in base:
        listed = client.get("/tasks/", params={"class_level": row["value"], "limit": 1})
        assert listed.json()["total"] == row["count"]


def test_total_follows_filters_and_bank_total_does_not():
    params = {"class_level": 2, "difficulty": "trudne", "task_type": "zamknięte"}
    facets = client.get("/tasks/facets", params=params).json()
    assert facets["total"] == client.get("/tasks/", params=params).json()["total"]
    assert facets["bank_total"] == count_tasks()
    assert facets["total"] < facets["bank_total"]


def test_counts_narrow_with_other_filters():
    """Licznik "zamknięte" maleje po zaznaczeniu trudności."""
    base = as_dict(
        client.get("/tasks/facets", params={"class_level": 2}).json()["task_type"]
    )
    narrowed = as_dict(
        client.get(
            "/tasks/facets", params={"class_level": 2, "difficulty": "trudne"}
        ).json()["task_type"]
    )
    assert narrowed["zamknięte"] < base["zamknięte"]
    listed = client.get(
        "/tasks/",
        params={"class_level": 2, "difficulty": "trudne", "task_type": "zamknięte"},
    ).json()
    assert narrowed["zamknięte"] == listed["total"]


def test_own_filter_does_not_narrow_its_own_counts():
    """Zaznaczenie "łatwe" nie zeruje liczników pozostałych trudności."""
    base = client.get("/tasks/facets", params={"class_level": 2}).json()
    selected = client.get(
        "/tasks/facets", params={"class_level": 2, "difficulty": "łatwe"}
    ).json()
    assert selected["difficulty"] == base["difficulty"]
    assert selected["total"] < base["total"]


def test_values_stay_listed_with_zero_count():
    with SessionMaker() as db:
        topic = (
            db.query(Task.topic)
            .filter(Task.class_level == 1, ~is_blank(Task.topic))
            .first()[0]
        )
    base = client.get("/tasks/facets", params={"class_level": 1}).json()
    narrowed = client.get(
        "/tasks/facets", params={"class_level": 1, "topic": topic}
    ).json()
    # Te same pozycje na liście, nawet jeśli część ma teraz 0
    for field in ("difficulty", "scope", "task_type", "source", "topic"):
        assert [r["value"] for r in narrowed[field]] == [r["value"] for r in base[field]]
    assert narrowed["topic"] == base["topic"]


def test_facets_total_matches_task_list():
    facets = client.get("/tasks/facets").json()
    assert facets["total"] == client.get("/tasks/").json()["total"] == count_tasks()


def test_difficulty_count_includes_blank():
    difficulty = as_dict(client.get("/tasks/facets").json()["difficulty"])
    blank = count_tasks(is_blank(Task.difficulty))
    assert blank > 0
    assert difficulty["łatwe"] == count_tasks(Task.difficulty == "łatwe") + blank
    # Puste pole nie jest osobnym koszykiem
    assert "" not in difficulty and "None" not in difficulty
    # Suma liczników przekracza total — zamierzone (FR-3)
    assert sum(difficulty.values()) > count_tasks()


def test_facet_count_equals_filtered_list_total():
    """Licznik przy filtrze = liczba zadań po jego zaznaczeniu."""
    facets = client.get("/tasks/facets", params={"class_level": 2}).json()
    for field in ("difficulty", "scope", "task_type"):
        for row in facets[field]:
            listed = client.get(
                "/tasks/", params={"class_level": 2, field: row["value"], "limit": 1}
            ).json()
            assert listed["total"] == row["count"], (field, row["value"])


def test_topics_are_per_class():
    all_topics = as_dict(client.get("/tasks/facets").json()["topic"])
    class_1 = as_dict(
        client.get("/tasks/facets", params={"class_level": 1}).json()["topic"]
    )
    class_4 = as_dict(
        client.get("/tasks/facets", params={"class_level": 4}).json()["topic"]
    )
    assert class_1 and class_4
    assert set(class_1) != set(class_4)
    assert set(class_1) < set(all_topics)
    topic = next(iter(class_1))
    assert class_1[topic] == count_tasks(
        Task.topic == topic, or_(Task.class_level == 1, Task.class_level.is_(None))
    )


def test_task_detail_returns_answers_in_display_order():
    with SessionMaker() as db:
        task_id = db.query(Answer.task_id).first()[0]
        expected = [
            a.id
            for a in db.query(Answer)
            .filter(Answer.task_id == task_id)
            .order_by(Answer.display_order)
        ]
    body = client.get(f"/tasks/{task_id}").json()
    assert body["id"] == task_id
    assert [a["id"] for a in body["answers"]] == expected
    assert all("is_valid" in a for a in body["answers"])


def test_task_detail_open_task_has_empty_answers():
    with SessionMaker() as db:
        task_id = (
            db.query(Task.id).filter(~Task.answers.any()).order_by(Task.id).first()[0]
        )
    assert client.get(f"/tasks/{task_id}").json()["answers"] == []


def test_task_detail_returns_hidden_twin():
    with SessionMaker() as db:
        hidden_id = (
            db.query(Task.id)
            .filter(Task.twin_task_id < Task.id)
            .order_by(Task.id)
            .first()[0]
        )
    assert client.get(f"/tasks/{hidden_id}").status_code == 200


def test_task_detail_404_and_422():
    assert client.get("/tasks/999999999").status_code == 404
    assert client.get("/tasks/abc").status_code == 422
