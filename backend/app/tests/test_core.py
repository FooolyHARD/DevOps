import logging

from app.core.config import get_settings
from app.core.logging import configure_logging


def test_settings_loaded():
    settings = get_settings()
    assert settings.app_name
    assert settings.database_url.startswith("sqlite")


def test_configure_logging_sets_level():
    configure_logging()
    logger = logging.getLogger()
    assert logger.level == logging.INFO
