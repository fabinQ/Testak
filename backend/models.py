from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import mapped_column, Mapped
from sqlalchemy import Integer, String, Boolean, Text

# Klasa bazowa dla modeli SQLAlchemy
class Base(DeclarativeBase):
    pass

class Task(Base):

    # Nazwa tabeli w bazie danych
    __tablename__ = "tasks"

    # Definicja kolumn tabeli
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(Integer)
    subject: Mapped[str] = mapped_column(String(50), index=True)
    class_level: Mapped[str] = mapped_column(Integer, index=True)
    difficulty: Mapped[str] = mapped_column(String(50), index=True)
    task_type: Mapped[str] = mapped_column(String(50), index=True)
    scope: Mapped[str] = mapped_column(String, index=True)
    topic: Mapped[str] = mapped_column(String, index=True)
    points: Mapped[int] = mapped_column(Integer)
    time_minutes: Mapped[int] = mapped_column(Integer)
    source: Mapped[str] = mapped_column(String, index=True)
    twin_task_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True, autoincrement=True)

    # Treść zadania w formacie tekstowym i HTML
    content_text: Mapped[str] = mapped_column(Text)
    content_html: Mapped[str] = mapped_column(Text)