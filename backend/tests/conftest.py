# backend/tests/conftest.py
import os
import sys
import pytest
from fastapi.testclient import TestClient

# Lägg till backend-mappen på sys.path så att "import app" funkar
HERE = os.path.dirname(os.path.abspath(__file__))      # .../pingforbeer/backend/tests
BACKEND_DIR = os.path.dirname(HERE)                    # .../pingforbeer/backend
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Viktigt: sätt test-databas INNAN app importeras
os.environ["DATABASE_URL"] = "sqlite:///./test.sqlite3"

from app.db import Base, engine, SessionLocal
from app.main import app


@pytest.fixture(autouse=True)
def setup_db():
    """Nollställer DB före varje test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)