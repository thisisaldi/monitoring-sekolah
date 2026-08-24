# --- Stage 1: build Tailwind CSS with the standalone CLI (no Node.js needed) ---
FROM debian:bookworm-slim AS tailwind-build
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN curl -sL -o /usr/local/bin/tailwindcss \
    https://github.com/tailwindlabs/tailwindcss/releases/latest/download/tailwindcss-linux-x64 \
    && chmod +x /usr/local/bin/tailwindcss
WORKDIR /app
COPY tailwind/input.css tailwind/input.css
COPY templates templates
COPY apps apps
RUN tailwindcss -i ./tailwind/input.css -o ./static/css/output.css --minify

# --- Stage 2: application image ---
FROM python:3.12-slim AS app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
COPY --from=tailwind-build /app/static/css/output.css static/css/output.css

RUN useradd --create-home appuser
USER appuser

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
