from sqlalchemy import Boolean, ForeignKey, Integer, LargeBinary, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


# Klasa bazowa dla modeli SQLAlchemy (jedna dla banku i przyszłych tabel własnych)
class Base(DeclarativeBase):
    pass


# Tabele banku (tasks, answers, images, task_images) są TYLKO DO ODCZYTU.
# Schemat odzwierciedla realną bazę (PRD 5.2) — nie uruchamiać na nich create_all.


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    external_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    date_created: Mapped[str | None] = mapped_column(Text)
    subject: Mapped[str] = mapped_column(Text, nullable=False)
    class_level: Mapped[int | None] = mapped_column(Integer, index=True)
    difficulty: Mapped[str | None] = mapped_column(Text)
    task_type: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    scope: Mapped[str | None] = mapped_column(Text)
    topic: Mapped[str | None] = mapped_column(Text)
    points: Mapped[int | None] = mapped_column(Integer)
    time_minutes: Mapped[int | None] = mapped_column(Integer)
    source: Mapped[str | None] = mapped_column(Text)
    content_html: Mapped[str] = mapped_column(Text, nullable=False)
    content_text: Mapped[str | None] = mapped_column(Text)
    twin_task_id: Mapped[int | None] = mapped_column(ForeignKey("tasks.id"))
    created_at: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[str] = mapped_column(Text, nullable=False)

    answers: Mapped[list["Answer"]] = relationship(
        back_populates="task", order_by="Answer.display_order"
    )
    task_images: Mapped[list["TaskImage"]] = relationship(back_populates="task")


class Answer(Base):
    __tablename__ = "answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id"), nullable=False, index=True)
    answer_label: Mapped[str | None] = mapped_column(Text)
    content_html: Mapped[str] = mapped_column(Text, nullable=False)
    content_text: Mapped[str | None] = mapped_column(Text)
    is_valid: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False)

    task: Mapped["Task"] = relationship(back_populates="answers")


class Image(Base):
    __tablename__ = "images"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    filename: Mapped[str] = mapped_column(Text, unique=True, nullable=False, index=True)
    file_data: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    mime_type: Mapped[str] = mapped_column(Text, nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[str] = mapped_column(Text, nullable=False)


class TaskImage(Base):
    __tablename__ = "task_images"

    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id"), primary_key=True)
    image_id: Mapped[int] = mapped_column(ForeignKey("images.id"), primary_key=True)
    context: Mapped[str] = mapped_column(Text, primary_key=True)

    task: Mapped["Task"] = relationship(back_populates="task_images")
    image: Mapped["Image"] = relationship()
