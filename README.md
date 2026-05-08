# Compulysis


Compulysis is a clinical web application for working with OCD-oriented patient assessment workflows. It combines a React frontend with a FastAPI backend so psychologists can manage patients, capture assessment responses, review risk levels, explore CSV-based data, and view report and model summaries in one place.

## What the project is for

Compulysis is designed to support day-to-day clinical workflow, not replace it. The application focuses on:

- Patient management and assessment tracking
- Risk-oriented summaries and dashboard views
- OCD assessment scoring and model comparison views
- Report generation and export
- CSV-based data exploration for clinical review
- Secure login and authenticated access to private routes

## What the project is not about

Compulysis is not intended to be:

- A general-purpose electronic medical record system
- A telemedicine or video-consultation platform
- A medication prescribing or pharmacy workflow tool
- An emergency triage or crisis-response system
- A consumer wellness app for self-diagnosis
- A replacement for professional clinical judgment
- A raw machine-learning research notebook or experiment dump
- A multi-tenant hospital platform with broad enterprise integrations

## Technologies used

### Frontend

- React 19
- Vite
- React Router
- Axios
- Tailwind CSS
- Recharts
- Lucide React icons
- Zustand for client-side state
- jsPDF and jsPDF-AutoTable for exports

### Backend

- FastAPI
- SQLAlchemy
- PostgreSQL
- Uvicorn
- Pydantic-style settings and validation patterns
- CORS middleware for browser access control

### Deployment and tooling

- Docker and Docker Compose for local/containerized runs
- AWS deployment guidance in the repository docs
- Vercel deployment support for the frontend and backend
- Jenkinsfile for CI-oriented workflows
- CSV seed and exploration scripts for clinical demo data

## Main application areas

- Authentication and protected routes
- Dashboard summaries and risk charts
- Patient CRUD and archive flows
- Assessment forms and results views
- Model lab pages for comparing model performance
- Data explorer pages for CSV-driven review
- Reports pages for viewing and exporting output

## Project layout

- `frontend/` - React client
- `backend/` - FastAPI application and services
- `docker-compose.yml` - local orchestration
- `Dockerfile` - container image build


The frontend README in [frontend/README.md](frontend/README.md) has the current setup steps and default seeded credentials.

## Notes

- The application is structured around authenticated psychologist workflows.
- The backend exposes API groups for auth, patients, assessments, dashboard data, reports, and data exploration.
- Deployment is documented for both AWS and Vercel as separate stacks.
