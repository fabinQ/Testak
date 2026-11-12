"""GET /images/{filename}: ETag, Cache-Control i odpowiedź 304."""
import pytest
from fastapi.testclient import TestClient

from database import SessionMaker
from main import app
from models import Image

client = TestClient(app)


@pytest.fixture(scope="module")
def image() -> dict:
    with SessionMaker() as db:
        row = db.query(Image.filename, Image.file_size, Image.mime_type).first()
    return {"filename": row.filename, "size": row.file_size, "mime": row.mime_type}


def test_image_has_cache_headers(image):
    res = client.get(f"/images/{image['filename']}")
    assert res.status_code == 200
    assert len(res.content) == image["size"]
    assert res.headers["content-type"].startswith(image["mime"])
    assert res.headers["etag"].startswith('"') and res.headers["etag"].endswith('"')
    assert "max-age=86400" in res.headers["cache-control"]


def test_matching_etag_returns_304_without_body(image):
    etag = client.get(f"/images/{image['filename']}").headers["etag"]
    res = client.get(f"/images/{image['filename']}", headers={"If-None-Match": etag})
    assert res.status_code == 304
    assert res.content == b""
    assert res.headers["etag"] == etag


def test_etag_list_and_weak_prefix_match(image):
    etag = client.get(f"/images/{image['filename']}").headers["etag"]
    header = f'"inny", W/{etag}'
    res = client.get(f"/images/{image['filename']}", headers={"If-None-Match": header})
    assert res.status_code == 304


def test_stale_etag_returns_full_image(image):
    res = client.get(
        f"/images/{image['filename']}", headers={"If-None-Match": '"nieaktualny"'}
    )
    assert res.status_code == 200
    assert len(res.content) == image["size"]


def test_etags_differ_between_images():
    with SessionMaker() as db:
        names = [row.filename for row in db.query(Image.filename).limit(2)]
    etags = {client.get(f"/images/{name}").headers["etag"] for name in names}
    assert len(etags) == 2


def test_missing_image_is_404():
    assert client.get("/images/nie-ma-takiego.svg").status_code == 404
