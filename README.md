# Revuwer

Application and reviewing system.

## Docker Compose Deployment

The root `docker-compose.yml` builds and runs both SvelteKit apps from this monorepo:

- `admin` listens on `${ADMIN_PORT:-3000}`.
- `platform` listens on `${PLATFORM_PORT:-3001}`.

Create a root `.env` from `.env.example`, fill in the production values, then run:

```sh
docker compose up --build -d
```

SvelteKit `PUBLIC_*` values are passed as build args because they are compiled into the client bundle. Private values such as PocketBase credentials, Resend, and OAuth secrets are runtime environment variables.
