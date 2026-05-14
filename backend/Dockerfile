FROM python:3.12-slim AS builder

WORKDIR /app

COPY pyproject.toml .
COPY app ./app
RUN pip wheel --no-cache-dir --wheel-dir /wheels .

FROM python:3.12-slim AS runtime

WORKDIR /app

COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir /wheels/* && rm -rf /wheels

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
