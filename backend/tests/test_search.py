"""Wyszukiwanie q po content_text (FR-2): polskie znaki, escapowanie % i _, czas."""
import time

import pytest
from fastapi.testclient import TestClient

from database import SessionMaker
from main import app, is_original
from models import Task

client = TestClient(app)


@pytest.fixture(scope="module")
def texts() -> list[str]:
    """Teksty widocznych zadań — wzorzec liczony w Pythonie, niezależnie od SQL."""
    with SessionMaker() as db:
        return [t or "" for (t,) in db.query(Task.content_text).filter(is_original())]


def expected_count(texts: list[str], phrase: str) -> int:
    needle = phrase.casefold()
    return sum(needle in text.casefold() for text in texts)


def search_total(phrase: str, **params) -> int:
    res = client.get("/tasks/", params={"q": phrase, "limit": 1, **params})
    assert res.status_code == 200
    return res.json()["total"]


@pytest.mark.parametrize("phrase", ["trójkąt", "TRÓJKĄT", "Trójkąt", "łącz", "ŚREDNI", "żeby"])
def test_search_ignores_case_for_polish_letters(texts, phrase):
    assert search_total(phrase) == expected_count(texts, phrase)


def test_polish_case_variants_give_same_nonzero_result(texts):
    lower, upper = search_total("trójkąt"), search_total("TRÓJKĄT")
    assert lower == upper > 0
    # Bez casefold wielkie polskie litery nie trafiałyby w tekst pisany małymi
    assert upper > sum("TRÓJKĄT" in text for text in texts)


@pytest.mark.parametrize("phrase", ["%", "_", "50%", "a_b", "\\"])
def test_wildcards_are_literal(texts, phrase):
    total = search_total(phrase)
    assert total == expected_count(texts, phrase)
    # Nieescapowane % lub _ pasowałyby do (prawie) wszystkich zadań
    assert total < len(texts)


def test_blank_query_means_no_filter(texts):
    assert search_total("") == search_total("   ") == len(texts)


def test_query_is_trimmed(texts):
    assert search_total("  trójkąt  ") == expected_count(texts, "trójkąt")


def test_phrase_is_matched_as_a_whole(texts):
    phrase = "pole trójkąta"
    assert search_total(phrase) == expected_count(texts, phrase)
    assert search_total(phrase) < search_total("trójkąt")


def test_search_combines_with_other_filters():
    with_class = search_total("trójkąt", class_level=1)
    assert 0 < with_class < search_total("trójkąt")
    body = client.get(
        "/tasks/", params={"q": "trójkąt", "class_level": 1, "limit": 200}
    ).json()
    assert all("trójkąt" in t["content_text"].casefold() for t in body["items"])


def test_facets_follow_search():
    facets = client.get("/tasks/facets", params={"q": "trójkąt"}).json()
    assert facets["total"] == search_total("trójkąt")
    assert facets["total"] < facets["bank_total"]


def test_too_long_query_is_rejected():
    assert client.get("/tasks/", params={"q": "a" * 201}).status_code == 422


@pytest.mark.parametrize("url", ["/tasks/", "/tasks/facets"])
def test_search_is_fast_enough(url):
    """FR-2: < 300 ms na całym banku (najgorszy przypadek: brak innych filtrów)."""
    client.get(url, params={"q": "rozgrzewka"})
    timings = []
    for phrase in ("trójkąt", "zzzz-nie-ma", "a"):
        start = time.perf_counter()
        assert client.get(url, params={"q": phrase}).status_code == 200
        timings.append(time.perf_counter() - start)
    assert max(timings) < 0.3, [round(t * 1000) for t in timings]
