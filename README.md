# 🔗 Submission Links

## GitHub Repository
`https://github.com/biswojitbiswal/Task-Flow`

## API Documentation
`https://drive.google.com/file/d/1KGwFSxMAOpCOVRYzqWsXucnY6UMQflOp/view?usp=drive_link`

## Demo Video
`https://drive.google.com/file/d/1qSJ_BQyT1yXk2_YJg9E8Kb6NFoKN_AOT/view?usp=drive_link`

## Postman Collection
`https://drive.google.com/file/d/1gSgL391tOhgA4OGvX9WZSYVWm9ZV1PJ_/view?usp=drive_link`

## Postman Environment
`https://drive.google.com/file/d/1o0HpH3iz81duqVBIhKPLbCsUrujozBH6/view?usp=drive_link`

# TaskFlow Backend

TaskFlow is a multi-tenant project-management API built for the TaskFlow backend assignment. Users work within organizations to manage projects, tasks, assignments, and comments. Task-assignment notifications are processed asynchronously by a separate worker.

## Highlights

- JWT authentication with access and refresh tokens; refresh tokens are persisted and revocable.
- Organization-scoped multi-tenancy: data access derives the organization from the authenticated user, preventing cross-tenant access.
- Role-based access control with `org_admin` and `member` roles.
- Project and task CRUD, pagination, search, and task filtering by status, priority, assignee, and due-date range.
- Task assignment/unassignment, comments, invitations, member management, and a project task-status dashboard.
- Swagger/OpenAPI documentation, Zod request validation, consistent API responses, and Jest/Supertest tests.
- Docker Compose environment for the API, worker, PostgreSQL, and Redis.

## Bonus functionality

| Feature | Implementation |
| --- | --- |
| Soft deletion | Projects and tasks use `deleted_at`; normal queries return active records only. |
| Bulk task update | `PATCH /api/v1/task/bulk-status` updates the status of multiple tenant-scoped tasks. |
| Assignment-email deduplication | Redis accepts one assignment notification per task/user pair in a five-second window. |
| Global email rate limit | The BullMQ worker processes at most 50 email jobs per minute. |

## Tech stack

NestJS, TypeScript, PostgreSQL, Prisma, Redis, BullMQ, JWT, bcrypt, Zod, Swagger/OpenAPI, Jest, Supertest, and Docker Compose.

## Architecture

```text
Client
  │
  ▼
NestJS API ───────────────► PostgreSQL (Prisma)
  │
  └── task assignment ────► Redis / BullMQ ────► Worker ────► mock email
                                      │
                                      └────────► dead-letter queue after final failure
```

The API and worker are separate processes. Assignment requests create the assignment and enqueue a notification job without waiting for email processing. Jobs retry up to four total attempts with exponential backoff; permanently failed jobs are placed in the dead-letter queue.

## Authorization and tenant isolation

Every protected request is authenticated with a bearer token. The active organization is carried in the authenticated user context rather than accepted as a client-controlled organization ID. Repository queries are scoped to that organization, so resources from another organization cannot be read or modified. Administrative actions, including project/task deletion, member-role updates, and task assignment, require `org_admin`.

## Getting started

### Prerequisites

- Node.js 22+
- npm
- PostgreSQL and Redis for local development, or Docker Desktop for the containerized setup

### Configuration

Copy the example environment file and set strong JWT secrets:

```powershell
Copy-Item .env.example .env
```

The application uses `PORT=3004` by default. Keep `.env` out of source control.

### Run locally

Install dependencies, apply migrations, seed demo data, then start the API and worker in separate terminals:

```powershell
npm install
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
```

```powershell
npm run start:worker
```

### Run with Docker

```powershell
docker compose up -d --build
docker compose exec api npx prisma migrate deploy
```

To seed the Docker database, build the seed stage and run it on the Compose network:

```powershell
docker build --target seed -t taskflow-seed .
docker run --rm --network taskflow_default -e DATABASE_URL="postgresql://taskflow:change-me@postgres:5432/taskflow" taskflow-seed
```
The Compose network is explicitly named `taskflow_default`, so the seed command works regardless of the directory name used to clone the repository.

If you change `POSTGRES_PASSWORD` in `.env`, use the same value in the seed command's `DATABASE_URL`.

The services are available as follows:

- API: `http://localhost:3004`
- Swagger UI: `http://localhost:3004/api/docs`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

Useful commands:

```powershell
docker compose ps
docker compose logs api
docker compose logs worker
docker compose down
```

> `docker compose down -v` also removes the local PostgreSQL and Redis volumes.

## API overview

All versioned endpoints are under `/api/v1`. Swagger is the complete, interactive API reference.

| Area | Representative endpoints |
| --- | --- |
| Authentication | `POST /auth/register`, `/auth/login`, `/auth/select-organization`, `/auth/refresh` |
| Projects | `POST/GET /projects`, `GET/PATCH/DELETE /projects/:id`, `GET /projects/:id/dashboard` |
| Tasks | `POST/GET /task`, `GET/PATCH/DELETE /task/:id`, `PATCH /task/bulk-status` |
| Assignments | `POST /task/:id/assign`, `DELETE /task/:id/assign/:userId` |
| Comments | `POST/GET /tasks/:taskId/comments`, `PATCH/DELETE /comments/:commentId` |
| Organization | Invitations and organization-member listing, role updates, and removal |
| Jobs | Test jobs, queue cleanup, job status, dead-letter queue inspection, and rate-limit testing |

Protected endpoints require:

```http
Authorization: Bearer <access-token>
```

## Demo data

The seed creates two organizations, five users, projects, tasks, assignments, and comments. Use any of the following accounts with password `Password123!` for local demonstrations:

- `alice@taskflow-demo.com`
- `bob@taskflow-demo.com`
- `charlie@taskflow-demo.com`
- `david@taskflow-demo.com`
- `eve@taskflow-demo.com`

## Testing

```powershell
npm run test
npm run test:e2e
npm run test:cov
```

The test suite covers authentication, validation, pagination, task operations, assignment behavior, and tenant-isolation scenarios.

## Project structure

```text
src/
├── auth/                 Authentication and token lifecycle
├── organization/         Organization domain
├── org-member/           Membership and roles
├── org-invitation/       Organization invitations
├── project/              Projects and dashboard
├── task/                 Tasks, filters, assignments, and bulk updates
├── comment/              Task comments
├── jobs/                 Queues, job status, and email processor
├── worker/               Worker module
├── prisma/               Prisma service
├── main.ts               API entry point
└── worker.ts             Worker entry point

prisma/                   Schema, migrations, and seed data
test/                     End-to-end test suite
docker-compose.yml        API, worker, PostgreSQL, and Redis services
```



## Security notes

Passwords are bcrypt-hashed. API input is validated with Zod, authentication is throttled, and secrets are loaded from environment variables. Never commit a populated `.env` file or production credentials.
