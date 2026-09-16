# NAMAMI

Agentic AI Marine Intelligence Platform for Smart India Hackathon 2026.

NAMAMI helps fishing communities and coastal operators ask operational questions, then returns **explainable** marine intelligence. Large language models may interpret a query, draft a plan, and explain a result. They **must not** independently issue safety-critical **Go / Caution / No-Go** outcomes. Those verdicts, PFZ ranking, geofences, and route restrictions come from deterministic, testable backend rules.

Default data mode is **FIXTURE**. INCOIS, IMD, Bhoonidhi, BHASHINI, and NavIC connectors are modular, flag-gated, and mocked until real credentials exist. The platform does not scrape protected government websites.

This repository is currently completing **Phase 0** (local platform foundation). Later phases add ingestion, kernels, the Ask pipeline, maps, and the Android field app.

## Architecture

| Layer | Stack | Role |
| --- | --- | --- |
| `mobile/` | Flutter (Android) | Field client placeholder |
| `web/` | Next.js + TypeScript | Web/admin dashboard placeholder |
| `edge/` | Node.js + Express | API gateway, health, typed contracts |
| `brain/` | Python + FastAPI | AI, geospatial, and data services |
| `db` | PostgreSQL + PostGIS | Spatial database |
| `redis` | Redis | Cache, session, job support |
| `minio` | MinIO | Object storage for granules/artifacts |

```
mobile  ──►  edge (:4000)  ──►  brain (:8000)
web     ──►     │                 │
                ▼                 ▼
              Redis           Postgres/PostGIS
                                MinIO
```

## Repository layout

```
NAMAMI/
  .github/workflows/ci.yml
  docker-compose.yml
  .env.example
  brain/          FastAPI service
  edge/           Express gateway
  web/            Next.js dashboard
  mobile/         Flutter app
  infra/          DB bootstrap SQL
  tests/          Cross-service tests
```

## Prerequisites

- Docker Desktop / Docker Compose (Postgres, Redis, MinIO, and all app containers)
- Node.js 20+ (edge + web)
- Python 3.11+ (brain, if running outside Docker)
- Flutter 3.24+ (mobile, optional for Phase 0)

## Setup

```bash
cp .env.example .env
# Optionally copy service-level examples:
cp brain/.env.example brain/.env
cp edge/.env.example edge/.env
cp web/.env.example web/.env
```

Do not put real API keys in git. Fixture mode needs none of the external keys populated.

### Start the stack

```bash
docker compose up --build
```

| Service | URL |
| --- | --- |
| Web placeholder | http://localhost:3000 |
| Web liveness | http://localhost:3000/api/healthz |
| Edge liveness | http://localhost:4000/healthz |
| Edge readiness | http://localhost:4000/readyz |
| Brain liveness | http://localhost:8000/healthz |
| Brain readiness | http://localhost:8000/readyz |
| Brain OpenAPI | http://localhost:8000/docs |
| MinIO console | http://localhost:9001 |

The web UI and mobile shell label **FIXTURE / DEMO** data. Treat it as simulated.

### Local (without Docker for app processes)

1. Start `db`, `redis`, and `minio` with Compose.
2. Brain: `python -m uvicorn app.main:app --reload --app-dir brain --port 8000`
3. Edge: `npm run dev -w @namami/edge`
4. Web: `npm run dev -w @namami/web`

Set `READY_STRICT=true` when you want `/readyz` to fail closed if Postgres, Redis, or MinIO are down. Default local tests use `READY_STRICT=false`.

## Scripts

From the repo root (after `npm install`):

```bash
npm run lint          # TypeScript lint (edge tsc + next lint)
npm run build         # edge + web
npm run test -w @namami/edge
npm run test -w @namami/web
python -m pip install -r brain/requirements.txt
python -m ruff check brain tests
python -m pytest tests brain/tests -q
```

Mobile:

```bash
cd mobile
flutter pub get
flutter analyze
flutter test
```

## Feature flags

Connectors stay off unless both `DATA_MODE=REAL` **and** the matching `FEATURE_*` flag is true. Empty API URLs/keys are expected in fixture mode.

| Flag | Default |
| --- | --- |
| `DATA_MODE` | `FIXTURE` |
| `FEATURE_INCOIS` | `false` |
| `FEATURE_IMD` | `false` |
| `FEATURE_BHOONIDHI` | `false` |
| `FEATURE_BHASHINI` | `false` |
| `FEATURE_NAVIC` | `false` |
| `FEATURE_MOSDAC` | `false` |

## Safety boundary

- LLM: understand queries, create plans, explain results.
- Deterministic kernels / rules: safety verdict, PFZ ranking, geofence, route restriction.
- Existing kernel unit tests in `tests/kernels/` remain the contract for verdict logic.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs Python lint/tests, Node lint/test/build, and Flutter analyze/test on every push and pull request.

## Phase 0 status

Phase 0 is the foundation only. Do not treat later Ask/map/NavIC endpoints as Phase 0 deliverables; they are retained from earlier work and stay behind fixture mode.
