import os
import sys
import tempfile
from pathlib import Path

import pytest

# Point the app at a throwaway database and backup dir *before* app modules are imported.
_tmp = Path(tempfile.mkdtemp(prefix="pf-test-"))
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp / 'test.db'}"
os.environ["BACKUP_DIR"] = str(_tmp / "backups")
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def backup_dir() -> Path:
    return _tmp / "backups"
