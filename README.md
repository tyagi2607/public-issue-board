# Public Issue Board

A civic-tech platform where citizens can report public issues, vote on them, and track their resolution — like a "GitHub Issues tracker for society."

---

## 🗂️ Project Structure

```
public-issue-board/
├── backend/          # FastAPI (Python) REST API
│   ├── app/
│   │   ├── auth/     # JWT auth, dependencies
│   │   ├── models/   # SQLAlchemy ORM models
│   │   ├── routers/  # API route handlers
│   │   ├── schemas/  # Pydantic request/response models
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/         # Next.js (React + TypeScript)
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # useAuth context
│   │   ├── lib/          # API client, utilities
│   │   ├── pages/        # Next.js pages
│   │   ├── styles/       # Tailwind CSS
│   │   └── types/        # TypeScript types
│   ├── package.json
│   └── Dockerfile
├── db/
│   ├── schema.sql    # Full PostgreSQL schema
│   └── seed.sql      # Seed data (categories, jurisdictions)
└── docker-compose.yml
```

---

## 🚀 Quick Start (Docker Compose)

### Prerequisites
- [Docker](https://www.docker.com/) and Docker Compose v2

### 1. Clone and configure

```bash
git clone https://github.com/tyagi2607/public-issue-board.git
cd public-issue-board

# Copy env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### 2. Start all services

```bash
docker compose up --build
```

This will:
- Start PostgreSQL with the schema and seed data pre-loaded
- Start Redis
- Start the FastAPI backend on **http://localhost:8000**
- Build and start the Next.js frontend on **http://localhost:3000**

### 3. Open the app

| Service       | URL                           |
|---------------|-------------------------------|
| Frontend      | http://localhost:3000         |
| Backend API   | http://localhost:8000/api/docs |
| API (ReDoc)   | http://localhost:8000/api/redoc |

---

## 🛠️ Local Development (without Docker)

### Backend

```bash
cd backend

# Create a virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure env
cp .env.example .env
# Edit .env with your local PostgreSQL/Redis connection strings

# Create the database
createdb public_issue_board
psql public_issue_board < ../db/schema.sql
psql public_issue_board < ../db/seed.sql

# Run the API
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Copy and configure env
cp .env.example .env.local

# Start development server
npm run dev
```

---

## 📡 API Endpoints

### Auth
| Method | Path                    | Description          |
|--------|-------------------------|----------------------|
| POST   | `/api/v1/auth/register` | Register a new user  |
| POST   | `/api/v1/auth/token`    | Login (get JWT)      |
| GET    | `/api/v1/auth/me`       | Get current user     |

### Issues
| Method | Path                        | Description              |
|--------|-----------------------------|--------------------------|
| POST   | `/api/v1/issues`            | Create an issue          |
| GET    | `/api/v1/issues`            | List issues (filterable) |
| GET    | `/api/v1/issues/{id}`       | Get issue detail         |
| PATCH  | `/api/v1/issues/{id}/status`   | Update status (mod+)  |
| PATCH  | `/api/v1/issues/{id}/moderate` | Moderate issue (mod+) |

### Voting
| Method | Path                     | Description     |
|--------|--------------------------|-----------------|
| POST   | `/api/v1/issues/{id}/vote` | Cast/change vote |
| DELETE | `/api/v1/issues/{id}/vote` | Remove vote     |

### Comments
| Method | Path                                    | Description      |
|--------|-----------------------------------------|------------------|
| GET    | `/api/v1/issues/{id}/comments`          | List comments    |
| POST   | `/api/v1/issues/{id}/comments`          | Add comment      |
| DELETE | `/api/v1/issues/{id}/comments/{cid}`    | Hide comment (mod+) |

### Dashboard
| Method | Path                        | Description        |
|--------|-----------------------------|--------------------|
| GET    | `/api/v1/dashboard/stats`   | Aggregated stats   |
| GET    | `/api/v1/dashboard/top-issues` | Top issues by score |

### Metadata
| Method | Path                       | Description           |
|--------|----------------------------|-----------------------|
| GET    | `/api/v1/categories`       | List all categories   |
| GET    | `/api/v1/jurisdictions`    | List all jurisdictions |
| GET    | `/api/v1/government-bodies` | List government bodies |

---

## 🗄️ Database Schema

Key tables:
- **users** – citizens, moderators, admins
- **issues** – core issue data with location, votes (denormalised), status
- **categories** – seeded (Infrastructure, Healthcare, Environment, etc.)
- **jurisdictions** – seeded (federal, provincial, municipal)
- **government_bodies** – linked to jurisdictions
- **votes** – unique per user per issue (upvote / downvote)
- **comments** – nested thread support via `parent_id`
- **issue_status_history** – full audit trail of status changes
- **issue_evidence** – attached images, links, documents

See [`db/schema.sql`](db/schema.sql) for the full DDL.

---

## 🔐 Security

- JWT Bearer tokens (24h expiry)
- Bcrypt password hashing
- 1 vote per user per issue enforced at DB level (unique constraint)
- Role-based access control (citizen / moderator / admin)
- Rate limiting via SlowAPI
- Input validation via Pydantic

---

## 🌍 Frontend Pages

| Path             | Description                      |
|------------------|----------------------------------|
| `/`              | Issue list with filters/sort     |
| `/issues/new`    | Create issue form                |
| `/issues/[id]`   | Issue detail, voting, comments   |
| `/dashboard`     | Stats and top issues             |
| `/login`         | Sign in                          |
| `/register`      | Create account                   |

---

## 🔮 Future Roadmap

- Social media ingestion (Twitter/X)
- AI classification of issues
- Duplicate detection
- Government dashboards and performance scoring
- Map-based issue discovery (Leaflet ready)
- Reputation-based voting weights
- Email notifications
