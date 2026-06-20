# Namma Trust

AI-driven event congestion forecasting and resource recommendation for **Bangalore City Traffic Police** — built for the Flipkart Grid Hackathon **Event-Driven Congestion** problem statement.

## What it does

- **Forecast** congestion impact (score 1–10), duration, and road-closure probability for planned & unplanned events
- **Recommend** optimal manpower, barricade placement, and diversion routes
- **Visualize** 8,000+ historical Astram events on an interactive map
- **Learn** from post-event feedback to improve predictions over time

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, Leaflet, Recharts |
| Backend | FastAPI, scikit-learn (Gradient Boosting + Random Forest) |
| Data | Astram anonymized event dataset (8,173 records) |

## Quick Start

### 1. Backend

```bash
cd eventflow/backend
pip install -r requirements.txt
python -m app.ml.trainer          # Train models (first time only)
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd eventflow/frontend
npm install
npm run dev
```

Open **http://localhost:5173** — you will be prompted to **Sign in with Google** before accessing the app.

Or double-click `start.bat` in the `eventflow` folder to launch both servers.

## Google Sign-In (required)

All pages and API routes (except health check and login) require authentication.

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an **OAuth 2.0 Client ID** (Web application).
2. Add **Authorized JavaScript origins**: `http://localhost:5173`
3. Copy credentials into env files:
   - `backend/.env` — `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`
   - `frontend/.env` — `VITE_GOOGLE_CLIENT_ID` (same client ID as backend)
4. Restart both servers after changing env files.

Generate a JWT secret:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check (public) |
| POST | `/api/auth/google` | Google sign-in (public) |
| GET | `/api/auth/me` | Current user profile |
| GET | `/api/analytics/summary` | Dashboard stats |
| GET | `/api/events/map` | Geo events for map |
| POST | `/api/forecast` | AI impact forecast + recommendations |
| POST | `/api/chat` | Natural-language agent |
| POST | `/api/feedback` | Post-event learning log |

## Model Performance

- Congestion score: MAE 0.29, R² 0.90
- Road closure prediction: 90.3% accuracy
- Duration: MAE ~68h (high variance due to long-running construction events)

## Pages

1. **AI Agent** — Chat in plain English → autonomous forecast + deployment plan
2. **Overview** — Analytics, cause breakdown, corridor risk table
3. **Live Map** — Filterable event heatmap across Bengaluru
4. **Event Planner** — Input event details → get AI forecast + deployment plan
5. **Learning** — Feedback loop for continuous improvement

## AI Agent

Open **AI Agent** in the sidebar and type naturally:

```
Cricket match at Chinnaswamy Stadium Saturday evening
Political rally on Mysore Road Sunday morning
What are the highest risk corridors?
```

The agent runs: **Sense** (parse message) → **Forecast** (ML models) → **Plan** (recommendations) → **Explain** (OpenRouter LLM, optional)

### Enable richer LLM explanations (OpenRouter)

1. Get a free API key at [openrouter.ai/keys](https://openrouter.ai/keys)
2. Copy `backend/.env.example` to `backend/.env`
3. Set your key:
   ```
   OPENROUTER_API_KEY=sk-or-v1-your-key-here
   OPENROUTER_MODEL=qwen/qwen-2.5-7b-instruct
   ```
4. Restart the backend — the AI Agent page will show **LLM enhanced**

Without a key, the agent still works using template-based replies.

## Test scenarios

See `TEST_EVENTS.txt` for five demo scenarios (cricket match, rally, construction, bus breakdown, tree fall).

## Production deployment (Vercel)

**Live:** [https://namma-trust.vercel.app](https://namma-trust.vercel.app)

Deploy from the `eventflow` folder:

```bash
cd eventflow
vercel deploy --prod --yes --functions-beta
```

Required Vercel env vars: `VITE_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`, `OPENROUTER_API_KEY` (optional), `FRONTEND_URL=https://namma-trust.vercel.app`.

The Astram dataset ships as `backend/data/events.csv`. Google OAuth must include `https://namma-trust.vercel.app` as an authorized origin.

### GitHub auto-deploy

Add repository secret `VERCEL_TOKEN`. Pushes to `main` run tests and deploy via `.github/workflows/vercel-deploy.yml`.

### API tests

```bash
cd eventflow/backend
pytest tests/test_api.py -q
```
