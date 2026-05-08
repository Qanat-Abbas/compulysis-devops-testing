FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
ENV VITE_API_URL=/api/v1
RUN npm run build

FROM python:3.11-slim


WORKDIR /app/backend

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev nginx \
    && rm -rf /var/lib/apt/lists/*

COPY backend/app/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY backend/ /app/backend/

COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
RUN rm -f /etc/nginx/sites-enabled/default /etc/nginx/sites-available/default

EXPOSE 80 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]