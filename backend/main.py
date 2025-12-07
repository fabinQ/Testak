from fastapi import FastAPI, Depends, HTTPException
from database import engine, SessionMaker
from models import Task, Image
from typing import Annotated
from sqlalchemy.orm import Session
from starlette.responses import StreamingResponse


app = FastAPI()

def get_session():
    Session = SessionMaker()
    try:
        yield Session
    finally:
        Session.close()

@app.get("/tasks/")
def read_tasks( db: Annotated[Session, Depends(get_session)]):
    tasks = db.query(Task).limit(50).all()
    return tasks

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