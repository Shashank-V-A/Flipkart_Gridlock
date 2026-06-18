# EventFlow AI

AI-driven event congestion forecasting and resource recommendation system for Bengaluru traffic — built for the Flipkart Grid Hackathon **Event-Driven Congestion** problem statement.

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

Open **http://localhost:5173**

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/analytics/summary` | Dashboard stats |
| GET | `/api/events/map` | Geo events for map |
| POST | `/api/forecast` | AI impact forecast + recommendations |
| POST | `/api/feedback` | Post-event learning log |

## Model Performance

- Congestion score: MAE 0.29, R² 0.90
- Road closure prediction: 90.3% accuracy
- Duration: MAE ~68h (high variance due to long-running construction events)

## Pages

1. **AI Agent** — Chat in plain English → autonomous forecast + deployment plan
2. **Dashboard** — Analytics, cause breakdown, corridor risk table
3. **Live Map** — Filterable event heatmap across Bengaluru
4. **Event Planner** — Input event details → get AI forecast + deployment plan
5. **Post-Event Learning** — Feedback loop for continuous improvement

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
4. Restart the backend — the AI Agent page will show **LLM Enhanced**

Without a key, the agent still works using template-based replies.
