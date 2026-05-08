# Compulysis Web App

Frontend is built with React + Vite and is now integrated with the root FastAPI backend (PostgreSQL).

## Project structure

- Frontend: `compulysis-webapp/frontend`
- Backend (FastAPI): `compulysis-webapp/backend`

## 1) Start PostgreSQL

Create a PostgreSQL database (example name):

- `compulysis_db`

Backend reads DB settings from `backend/app/.env` using `DATABASE_URL`.

Example:

- `DATABASE_URL=postgresql://postgres:password@localhost:5432/compulysis_db`
- `SECRET_KEY=change-this-in-production`

## 2) Run backend (FastAPI)

From `compulysis-webapp/backend`:

1. Activate your virtual environment (or create one).
2. Install requirements:
	- `pip install -r app/requirements.txt`
3. Run API:
	- `python run.py`

API base URL: `http://localhost:8000/api/v1`

Default seeded login:

- Email: `psychologist@compulysis.com`
- Password: `password123`

## 3) Run frontend

From `compulysis-webapp/frontend`:

1. Install dependencies:
	- `npm install`
2. Ensure `.env` has:
	- `VITE_API_URL=http://localhost:8000/api/v1`
3. Start app:
	- `npm run dev`

## Implemented backend API groups

- Auth: `/auth/login`, `/auth/register`, `/auth/me`
- Patients: `/patients/me`, `/patients/statistics`, `/patients/{id}`
- Assessments: `/assessments`
- Reports: `/reports`, `/reports/statistics`, `/reports/{reportId}/download`
- Dashboard: `/dashboard/*`
- Data Explorer: `/data-explorer/*`

## Independent AWS and Vercel deployments (no cross-communication)

Deploy as two separate stacks:

1. **AWS stack**
	- Frontend (AWS): set `VITE_API_URL` to AWS backend URL only.
	- Backend (AWS): set `BACKEND_CORS_ORIGINS` to AWS frontend URL only.

2. **Vercel stack**
	- Frontend (Vercel): set `VITE_API_URL` to Vercel backend URL only.
	- Backend (Vercel): set `BACKEND_CORS_ORIGINS` to Vercel frontend URL only.

### Required environment variables

Frontend:

- `VITE_API_URL=<this frontend's own backend>/api/v1`

Backend:

- `DATABASE_URL=<platform-specific database>`
- `SECRET_KEY=<strong secret>`
- `ENVIRONMENT=production`
- `BACKEND_CORS_ORIGINS=<this backend's own frontend origin>`
- `CORS_ALLOW_ORIGIN_REGEX=` (leave empty in production)

### Example values

AWS frontend env:

- `VITE_API_URL=https://api-aws.example.com/api/v1`

AWS backend env:

- `BACKEND_CORS_ORIGINS=https://app-aws.example.com`

Vercel frontend env:

- `VITE_API_URL=https://compulysis-backend.vercel.app/api/v1`

Vercel backend env:

- `BACKEND_CORS_ORIGINS=https://compulysis-frontend.vercel.app`

If set this way, AWS and Vercel stacks stay isolated and do not communicate with each other.

## Docker deployment

For Docker-based local run and AWS deployment steps, see:

- `../DOCKER_AWS_GUIDE.md`
