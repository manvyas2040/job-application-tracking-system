from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DB_URL = "postgresql+psycopg2://postgres:man1755@localhost:5432/demodb"

engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 
