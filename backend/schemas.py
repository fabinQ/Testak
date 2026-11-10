from pydantic import BaseModel, ConfigDict


# Schematy odpowiedzi API (tylko odczyt banku)


class AnswerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    answer_label: str | None
    content_html: str
    content_text: str | None
    # Decyzja: is_valid jest wystawiane (aplikacja jednego nauczyciela);
    # komponenty arkusza nie mogą go renderować
    is_valid: bool
    display_order: int


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    external_id: int
    subject: str
    class_level: int | None
    difficulty: str | None
    task_type: str
    scope: str | None
    topic: str | None
    points: int | None
    time_minutes: int | None
    source: str | None
    content_html: str
    content_text: str | None
    twin_task_id: int | None


class TaskListOut(BaseModel):
    items: list[TaskOut]
    # Liczba zadań pasujących do filtrów, przed limit/offset
    total: int
