import os

import pytest
from fastapi.testclient import TestClient

os.environ["DATABASE_URL"] = "sqlite+pysqlite:////tmp/marine_toxicity_test.db"
os.environ["BOOTSTRAP_ADMIN_PASSWORD"] = "admin123"

from app.db.base import Base
from app.db.init_data import bootstrap_data
from app.db.session import SessionLocal, engine
from app.main import app


@pytest.fixture()
def client():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        bootstrap_data(db)
    with TestClient(app) as test_client:
        yield test_client
