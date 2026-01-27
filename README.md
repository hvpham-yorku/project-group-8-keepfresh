# KeepFresh

## Stack
- **Frontend**: Next.js + TypeScript + Tailwind CSS
- **Backend**: FastAPI + Python + OpenAPI docs
- **Database**: MongoDB

## Quick Start

```bash
docker-compose up --build
```

**Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- MongoDB: mongodb://localhost:27017

**Stop:**
```bash
docker-compose down -v
```

## Structure
```
├── frontend/     # Next.js app
├── backend/      # FastAPI app
└── docker-compose.yml
```
