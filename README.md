# AskMyData

> Talk to your CSV files in plain English. Get answers, charts, and insights — instantly.

![AskMyData demo](https://placehold.co/1200x600/1e1e2e/3b82f6?text=AskMyData)

## What it does

AskMyData lets you upload a CSV file and ask questions about it in natural language. Under the hood, it tries to answer using SQL (via DuckDB) and falls back to a Pandas agent when the query is too complex. Every response is persisted in a project history, and numerical results are automatically rendered as charts.

**Example questions you can ask:**
- *"What was total revenue per region in Q4?"*
- *"Which product had the highest margin?"*
- *"Are there any outliers in the price column?"*
- *"Show me monthly trends for units sold"*

---

## Tech stack

### Backend
- **FastAPI** — modular monolith with well-defined module boundaries
- **DuckDB** — runs SQL directly on CSV files, no database setup needed
- **Pandas** — fallback agent for complex analytical queries
- **Anthropic API** (claude-sonnet) — SQL generation, answer formatting, pandas reasoning
- **PostgreSQL** — users, projects, and message history
- **SQLAlchemy + Alembic** — ORM and migrations
- **JWT + Google OAuth** — authentication

### Frontend
- **Next.js 14** (App Router) — React framework
- **Tailwind CSS** — styling
- **Chart.js + react-chartjs-2** — automatic chart rendering
- **Axios** — API client with JWT interceptor

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   Next.js frontend                   │
│  Login · Dashboard · Project chat · Theme toggle     │
└───────────────────────┬──────────────────────────────┘
                        │ REST + JWT
┌───────────────────────▼──────────────────────────────┐
│              FastAPI — modular monolith               │
│                                                      │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌───────┐ │
│  │  auth   │  │ projects │  │messages │  │ query │ │
│  └─────────┘  └──────────┘  └─────────┘  └───┬───┘ │
└──────────────────────────────────────────────┼──────┘
                                               │
                        ┌──────────────────────▼──────┐
                        │         Query engine         │
                        │                              │
                        │  1. LLM generates SQL        │
                        │  2. DuckDB executes          │
                        │  3. Pandas fallback          │
                        │  4. LLM formats answer       │
                        └──────────────┬───────────────┘
                                       │
              ┌────────────────────────▼──────────────┐
              │            PostgreSQL                  │
              │  users · projects · messages · files  │
              └────────────────────────────────────────┘
```

---

## Project structure

```
askmydata/
├── backend/
│   ├── main.py                  # app factory, routers, middleware
│   ├── database.py              # SQLAlchemy engine and session
│   ├── config.py                # settings via pydantic-settings
│   └── modules/
│       ├── auth/                # JWT, Google OAuth, bcrypt
│       ├── projects/            # CRUD, CSV upload, schema inference
│       ├── messages/            # conversation history per project
│       └── query/               # DuckDB → Pandas → Anthropic pipeline
└── frontend/
    ├── app/                     # Next.js App Router pages
    ├── components/              # UI, layout, chat, charts
    ├── hooks/                   # useProjects, useChat
    └── lib/                     # axios instance, auth helpers
```

---

## Getting started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL running locally

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/askmydata.git
cd askmydata
```

### 2. Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file:

```env
DATABASE_URL=postgresql+psycopg2://postgres:password@localhost:5432/askmydata
SECRET_KEY=your-secret-key-here
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Generate a secret key:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Run migrations and start the server:

```bash
alembic upgrade head
uvicorn main:app --reload
```

API docs available at `http://localhost:8000/docs`

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`

---

## How the query engine works

When you ask a question, the system follows this flow:

```
Question
   │
   ▼
LLM generates SQL using the inferred CSV schema
   │
   ▼
DuckDB executes the SQL directly on the CSV file
   │
   ├─ Success → LLM formats the result as natural language
   │            + raw data returned for chart rendering
   │
   └─ Failure → Pandas agent receives dataframe stats
                + LLM reasons over the summary
```

Every response includes which engine was used (SQL or Pandas), and SQL queries can be expanded in the UI for full transparency.

---

## Features

- **Projects** — each CSV upload lives in a named project with full conversation history
- **Hybrid query engine** — SQL-first with automatic Pandas fallback
- **Auto charts** — bar, line, or pie charts rendered automatically based on result shape
- **Query transparency** — see the exact SQL generated for every answer
- **Auth** — email/password and Google OAuth
- **Dark mode** — full light/dark theme toggle
- **Persistent history** — conversations saved per project in PostgreSQL

---

## API endpoints

```
POST   /auth/register
POST   /auth/login
GET    /auth/google
GET    /auth/google/callback
GET    /auth/me

POST   /projects/
GET    /projects/
GET    /projects/{id}
DELETE /projects/{id}
POST   /projects/{id}/upload

GET    /messages/{project_id}
DELETE /messages/{project_id}

POST   /query/
```

---

## Roadmap

- [ ] Multiple CSV files per project with JOIN support
- [ ] Export answers as PDF reports
- [ ] Shareable project links
- [ ] Streaming responses
- [ ] Support for Excel (.xlsx) files

---

## License

MIT
