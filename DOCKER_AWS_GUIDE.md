# Docker Compose + EC2 Deployment Guide (Compulysis)

This guide is for your assignment requirement: deploy to AWS EC2 using Dockerfiles and Docker Compose.

The stack in this repository runs:
- frontend container (React app served by Nginx)
- backend container (FastAPI web application)
- postgres container (database)

## 1) What was configured in this repo

- Backend Dockerfile: `backend/Dockerfile`
- Frontend Dockerfile: `frontend/Dockerfile`
- Compose orchestration: `docker-compose.yml`
- Persistent postgres volume: `postgres_data`

With this setup, webpage is available on port 8000 (default), API on 8001, and Postgres is internal-only in Docker.

## 2) Create EC2 instance

1. Launch an Ubuntu Server 22.04 or 24.04 EC2 instance (t3.small or higher recommended).
2. Attach a key pair.
3. Security Group inbound rules:
	 - TCP 22 from your IP only
	 - TCP 8000 from 0.0.0.0/0 (frontend webpage)
	 - TCP 8001 from 0.0.0.0/0 (backend API)
	 - No inbound rule needed for 5432 (database is internal to Docker network)
4. (Optional but recommended) Allocate and attach an Elastic IP.

## 3) SSH into EC2 and install Docker + Compose plugin

```bash
ssh -i /path/to/key.pem ubuntu@<EC2_PUBLIC_IP>

sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
	"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
	$(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker $USER
newgrp docker

docker --version
docker compose version
```

## 4) Pull your project on EC2

```bash
git clone <YOUR_REPO_URL>.git
cd compulysis-webapp
```

## 5) Set production environment values

Create a `.env` file at repository root (same level as `docker-compose.yml`):

```bash
cat > .env << 'EOF'
SECRET_KEY=replace-with-a-long-random-secret-at-least-32-chars
ENVIRONMENT=production

# Keep empty when using fixed allowed origins list.
CORS_ALLOW_ORIGIN_REGEX=

# Set to EC2 URL or your domain.
BACKEND_CORS_ORIGINS=http://<EC2_PUBLIC_IP>:8000,https://<YOUR_DOMAIN>

# Frontend host port (container still listens on 80 internally)
FRONTEND_PORT=8000

# Frontend uses same-origin '/api/v1' and Nginx proxies to backend container.
VITE_API_URL=/api/v1
EOF
```

Notes:
- Compose already defines `DATABASE_URL` for the internal postgres service.
- If you move to RDS later, override `DATABASE_URL` in `.env`.

## 6) Build, push, and run with Docker Hub image

Build the single app image from the root Dockerfile:

```bash
docker build -t zaibjahan200/compulysis-webapp:latest .
docker push zaibjahan200/compulysis-webapp:latest
```

Set the image name for Compose:

```bash
export APP_IMAGE=zaibjahan200/compulysis-webapp:latest
```

Then run Compose using the pushed image:

```bash
docker compose down --remove-orphans
docker compose up -d db backend frontend
docker compose ps
```

View logs:

```bash
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f db
```

## 7) Validate deployment

From EC2:

```bash
curl http://localhost:8000/
curl http://localhost:8001/
curl http://localhost:8001/api/v1/docs
curl http://localhost:8001/health
```

From your laptop/browser:
- `http://<EC2_PUBLIC_IP>:8000/`
- `http://<EC2_PUBLIC_IP>:8001/api/v1/docs`

## 8) Useful operations

Restart services:

```bash
docker compose restart
```

Pull latest code and redeploy:

```bash
git pull
docker compose up -d db backend frontend
```

Stop stack:

```bash
docker compose down
```

Stop and remove DB data volume:

```bash
docker compose down -v
```

## 9) Production recommendations (after assignment)

1. Use AWS RDS Postgres instead of containerized Postgres.
2. Store secrets in AWS Systems Manager Parameter Store or AWS Secrets Manager.
3. Add CloudWatch log shipping.
4. Add automated backups and monitoring alarms.
