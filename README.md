# KeepFresh

## Stack
- **Frontend**: Next.js + TypeScript + Tailwind CSS
- **Backend**: FastAPI + Python + OpenAPI docs
- **Database**: MongoDB

## Architecture

Grocery Receipt ingestion flow

<img width="456" height="928" alt="image" src="https://github.com/user-attachments/assets/d0ea0614-7df8-449c-b219-703e6b09e3e5" />


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
