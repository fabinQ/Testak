from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import mapped_column, Mapped
from sqlalchemy import Integer, String, Boolean, Text, LargeBinary

# Klasa bazowa dla modeli SQLAlchemy
class Base(DeclarativeBase):
    pass

class Task(Base):

    # Nazwa tabeli w bazie danych
    __tablename__ = "tasks"

    # Definicja kolumn tabeli
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    # external_id: Mapped[str] = mapped_column(Integer)
    subject: Mapped[str] = mapped_column(String(50), index=True)
    class_level: Mapped[int] = mapped_column(Integer, index=True)
    difficulty: Mapped[str] = mapped_column(String(50), index=True)
    task_type: Mapped[str] = mapped_column(String(50), index=True)
    scope: Mapped[str] = mapped_column(String, index=True)
    topic: Mapped[str] = mapped_column(String(150), index=True)
    points: Mapped[int] = mapped_column(Integer)
    time_minutes: Mapped[int] = mapped_column(Integer)
    source: Mapped[str] = mapped_column(String, index=True)
    twin_task_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True, autoincrement=True)
    created_at: Mapped[str] = mapped_column(String, index=True)
    
    # Treść zadania w formacie tekstowym i HTML
    content_text: Mapped[str] = mapped_column(Text)
    content_html: Mapped[str] = mapped_column(Text)

class Image(Base):

    # Nazwa tabeli w bazie danych
    __tablename__ = "images"

    # Definicja kolumn tabeli
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    filename: Mapped[str] = mapped_column(String, index=True)
    
    file_data: Mapped[bytes] = mapped_column(LargeBinary)
    mime_type: Mapped[str] = mapped_column(String, index=True)
    file_size: Mapped[int] = mapped_column(Integer)
