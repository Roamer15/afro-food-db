# Afro Food DB

Afro Food DB is an open-source database and public API of African recipes. It is built to serve two audiences at once: cooks who want accurate, well-sourced recipes, and developers who want a clean, well-documented API to build on.

## Status

This project is in early development (Phase 1). The database schema and API are being built out, and nothing described under "API (planned)" below is live yet. If you are looking for a working public endpoint, there isn't one yet — check back as the project progresses, or help build it.

## Tech stack

- NestJS 12 on Fastify
- Node.js
- Bun (package manager and script runner)
- PostgreSQL
- Prisma (ORM)
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

5. Set up the database schema.

   ```bash
   bunx prisma migrate dev
   bunx prisma generate
   ```

   The first command applies every migration in `prisma/migrations/` to the running container. The second writes the Prisma client to `src/generated/prisma`.

   Run both. `migrate dev` does not reliably generate the client on its own — when the database is already in sync it reports "Already in sync" and exits without generating anything. The client is gitignored and must exist before the API will build, so this step is required on a fresh clone, not optional. `bunx prisma generate` on its own is also what you want after pulling a branch that changed `schema.prisma` but no migrations.

6. Run the API.

   ```bash
   bun run start:dev
   ```

   This runs the API natively on Node — not in Docker — in watch mode, and serves it at `http://localhost:3000` by default (override with the `PORT` environment variable).

Only the database is containerized for now. This keeps local development close to production for the one piece of state that matters, while leaving the API itself fast to iterate on and debug directly on the host.

## Working with the database

The schema lives in `prisma/schema.prisma` and is managed with Prisma 7 (configured in `prisma7.config.ts` at the repo root). These are the commands you will use most:

```bash
bunx prisma migrate dev --name <name>   # create and apply a migration after editing schema.prisma
bunx prisma migrate status              # check whether the database matches the migration history
bunx prisma generate                    # regenerate the client only
bunx prisma studio                      # browse the data in a local GUI
```

**Warning:** `bunx prisma migrate reset` drops the entire database and replays every migration. Use it in development only, and never against anything you care about.

Note that `prisma/migrations/20261009115041_add_check_constraints/migration.sql` is hand-written, because Prisma cannot express CHECK constraints in the schema. It adds the `no_self_substitute` constraint on `ingredient_substitutes`, so if a future migration drops and recreates that table, the constraint must be re-added.

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
| `bun run validate` | Validate every YAML file in `data/` |

## Running tests

```bash
bun run test
bun run test:e2e
bun run test:cov
```

## Validating the data files

Every YAML file in `data/` is checked against the Zod schemas in `scripts/schemas/` by:

```bash
bun run validate
```

The check covers more than shape. Every recipe ingredient and tag must resolve against the files in `data/`, slugs must be unique, aliases must not collide, and an ingredient cannot substitute for itself. The validator prints one line per problem naming the file and field, and exits non-zero if it finds any. Run it before opening a pull request; CI runs it on every PR.

`test/fixtures/invalid-data/` is a deliberately broken copy of the data used to check that the validator still catches each class of error. The validator resolves its data root as the relative path `data`, so you point it at the fixtures by changing directory:

```bash
cd test/fixtures/invalid-data && ../../../node_modules/.bin/tsx ../../../scripts/validate.ts
```

It should report 12 problems. See that folder's README.md for the full list.

## Project structure

```
src/                              NestJS application source
  generated/prisma/               generated Prisma client (gitignored)
prisma/
  schema.prisma                   database schema
  migrations/                     migration history
scripts/
  validate.ts                     validates everything in data/
  schemas/                        Zod schemas (recipe, ingredient, substitute, tag, enums)
data/
  ingredients/                    proteins.yaml, vegetables.yaml, pantry.yaml
  tags.yaml
  substitutes.yaml
  recipes/cameroon/               ndole.yaml, poulet-dg.yaml, puff-puff.yaml
test/
  fixtures/invalid-data/          deliberately broken data used to exercise the validator
docker-compose.yaml               local PostgreSQL database
```

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

Recipes are contributed as YAML files under `data/` via pull request. CI validates every PR against the expected schema, and merging to `main` resyncs the PostgreSQL database from the data files. A `CONTRIBUTING.md` with detailed guidelines is coming; until then, open a PR and we'll work through it together. Please run `bun run validate` locally before opening a pull request, since CI runs the same check.

## License

This project uses two different licenses to cover the source code and the community-contributed data:

- **Source code:** all software code is licensed under the [MIT License](LICENSE).
- **Food data:** all YAML data files and seeded data are licensed under the [Creative Commons Attribution 4.0 International (CC-BY-4.0) License](LICENSE-DATA).

By contributing data to this project (via pull requests, issues, or forms), you agree to release your contributions under the CC-BY-4.0 License.
