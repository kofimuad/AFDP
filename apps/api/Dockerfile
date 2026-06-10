FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY . /app

EXPOSE 8000

# On boot: apply migrations (blocking — schema must be correct), then upsert the
# food/ingredient/cuisine catalog (best-effort, idempotent — powers the browse &
# cuisine/region filters), then start the server.
CMD ["sh", "-c", "alembic upgrade head && (python -m seeds.seed_catalog || echo 'catalog seed skipped') && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
