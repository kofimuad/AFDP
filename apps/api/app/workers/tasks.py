from celery import Celery

from app.core.config import get_settings

settings = get_settings()
celery_app = Celery("afdp", broker=settings.redis_url, backend=settings.redis_url)


@celery_app.task
def refresh_search_cache() -> str:
    """Placeholder periodic task to refresh popular search caches."""

    return "Search cache refresh task placeholder"
