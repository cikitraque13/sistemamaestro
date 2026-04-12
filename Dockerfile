# Railway Deployment
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# Override env for Railway: backend is same origin
ENV REACT_APP_BACKEND_URL=""
RUN yarn build

# Backend
FROM python:3.11-slim

WORKDIR /app

COPY railway/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY railway/server_railway.py ./server.py
COPY --from=frontend-build /app/frontend/build ./static

EXPOSE 8080

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080"]
