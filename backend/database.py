from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ścieżka absolutna: uruchomienie z innego cwd nie może utworzyć pustej bazy
DB_PATH = Path(__file__).resolve().parent / "tasks.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionMaker = sessionmaker(bind=engine, autocommit=False, autoflush=False)
