# Frontend
FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
ENV REACT_APP_BACKEND_URL=""
RUN npm run build

# Backend
FROM python:3.11-slim

WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
COPY railway/server_railway.py ./server.py
COPY --from=frontend-build /app/frontend/build ./frontend/build

ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-8080}"]
