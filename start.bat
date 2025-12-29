@echo off
ECHO Uruchamianie aplikacji...

REM Uruchomienie Backendu
ECHO Startuje backend...
start "Backend" cmd /k "call .\.venv\Scripts\activate.bat && cd backend && uvicorn main:app --reload"

REM Uruchomienie Frontendu
ECHO Startuje frontend...
start "Frontend" cmd /k "cd frontend && npm install && npm run dev"
