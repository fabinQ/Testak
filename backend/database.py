from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./tasks.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionMaker = sessionmaker(bind=engine, autocommit=False, autoflush=False)

