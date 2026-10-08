# Afro Food DB

Afro Food DB is an open-source database and public API of African recipes. It is built to serve two audiences at once: cooks who want accurate, well-sourced recipes, and developers who want a clean, well-documented API to build on.

## Status

This project is in early development (Phase 1). The database schema and API are being built out, and nothing described under "API (planned)" below is live yet. If you are looking for a working public endpoint, there isn't one yet — check back as the project progresses, or help build it.

## Tech stack

- NestJS 12 on Fastify
- Node.js
- Bun (package manager and script runner)
- PostgreSQL
- Zod (validation)
- Docker Compose (local database only)
- GitHub Actions (CI)

## Prerequisites

- Node.js
- Bun
- Docker and Docker Compose — only needed to run the local PostgreSQL database, not the API itself

## Getting started

1. Clone the repo:

   ```bash
   git clone https://github.com/Roamer15/afro-food-db.git
   cd afro-food-db
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Copy the environment file and edit the values:

   ```bash
   cp .env.example .env
   ```

   Docker Compose reads `.env` directly (`env_file: .env`), and the database container will not start without it.

4. Start the database.

   ```bash
   docker compose up -d
   ```

   (`docker compose up -d db` also works, since `db` is the only service.) This starts PostgreSQL 17 in a container, exposes it on host port **5433** (mapped to the container's internal 5432), and persists data in the `afro_food_data` Docker volume so it survives container restarts.

   Check that it's running:

   ```bash
   docker compose ps
   ```

   Follow its logs:

   ```bash
   docker compose logs -f db
   ```

   Stop it:

   ```bash
   docker compose down
   ```

   **Warning:** `docker compose down -v` also deletes the `afro_food_data` volume, permanently erasing your local database contents.

5. Run the API.

   ```bash
   bun run start:dev
   ```

   This runs the API natively on Node — not in Docker — in watch mode, and serves it at `http://localhost:3000` by default (override with the `PORT` environment variable).

Only the database is containerized for now. This keeps local development close to production for the one piece of state that matters, while leaving the API itself fast to iterate on and debug directly on the host.

## Available scripts

| Script | Description |
| --- | --- |
| `bun run build` | Build the NestJS application |
| `bun run start` | Start the API |
| `bun run start:dev` | Start the API in watch mode |
| `bun run start:debug` | Start the API in watch mode with the debugger attached |
| `bun run start:prod` | Run the built output (`dist/main`) |
| `bun run format` | Format `src/` and `test/` with Prettier |
| `bun run lint` | Lint `src/` and `test/` with oxlint |
| `bun run test` | Run unit tests |
| `bun run test:watch` | Run unit tests in watch mode |
| `bun run test:cov` | Run unit tests with coverage |
| `bun run test:debug` | Run unit tests with the debugger attached |
| `bun run test:e2e` | Run end-to-end tests |

## Running tests

```bash
bun run test
bun run test:e2e
bun run test:cov
```

## Project structure

```
src/                    NestJS application source
test/                   Tests
data/                   Recipe and ingredient data (not yet populated)
  ingredients/          Canonical ingredients with their aliases
  substitutes.yaml      Ingredient substitution rules
  tags.yaml             Recipe tags
  recipes/
    cameroon/
      ndole.yaml         Example recipe (planned)
docker-compose.yaml     Local PostgreSQL database
```

`data/` currently exists but is empty; the layout above reflects the planned structure, not what's there today.

## API (planned / roadmap)

Nothing below is implemented yet — it describes where the project is headed. All endpoints are read-only, paginated where noted, and require an `Authorization: Bearer <api-key>` header except `/health`. Interactive documentation will be served via Swagger at `/docs` once it exists.

| Endpoint | Description |
| --- | --- |
| `GET /v1/recipes` | List recipes, paginated; filter by region and tag |
| `GET /v1/recipes/:slug` | Get one recipe with steps, ingredients, notes, and tags |
| `GET /v1/recipes/search?q=` | Keyword search over recipes, paginated |
| `GET /v1/ingredients` | List ingredients, paginated; filter by category |
| `GET /v1/ingredients/:name` | Get one ingredient, resolved through aliases, with substitutes |
| `GET /v1/tags` | List all tags |
| `GET /health` | Report uptime; no API key required |

## Contributing

Recipes are contributed as YAML files under `data/` via pull request. CI validates every PR against the expected schema, and merging to `main` resyncs the PostgreSQL database from the data files. A `CONTRIBUTING.md` with detailed guidelines is coming; until then, open a PR and we'll work through it together.

## License

This project uses two different licenses to cover the source code and the community-contributed data:

- **Source code:** all software code is licensed under the [MIT License](LICENSE).
- **Food data:** all YAML data files and seeded data are licensed under the [Creative Commons Attribution 4.0 International (CC-BY-4.0) License](LICENSE-DATA).

By contributing data to this project (via pull requests, issues, or forms), you agree to release your contributions under the CC-BY-4.0 License.
