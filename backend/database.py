from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

# Ścieżka absolutna: uruchomienie z innego cwd nie może utworzyć pustej bazy
DB_PATH = Path(__file__).resolve().parent / "tasks.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})


def _casefold(value: str | None) -> str | None:
    return value.casefold() if value is not None else None


@event.listens_for(engine, "connect")
def register_sqlite_functions(dbapi_connection, _connection_record):
    # Funkcje SQLite są per połączenie, stąd rejestracja przy każdym "connect".
    # casefold: wyszukiwanie bez względu na wielkość liter także dla polskich
    # znaków (wbudowane lower()/LIKE obsługują tylko ASCII).
    dbapi_connection.create_function("casefold", 1, _casefold, deterministic=True)


SessionMaker = sessionmaker(bind=engine, autocommit=False, autoflush=False)
