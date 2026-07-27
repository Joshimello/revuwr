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

## Production Deployment with Coolify

Production images are built by `.github/workflows/deploy-production.yml` and published to:

- `ghcr.io/joshimello/revuwr-admin`
- `ghcr.io/joshimello/revuwr-platform`

Coolify should use `docker-compose.production.yml`, which pulls the prebuilt images instead of
building them on the production server. Keep the existing runtime environment variables configured
in Coolify.

The GitHub repository must define the public build-time variables referenced by the workflow. For
automatic deployment, also define these GitHub Actions secrets:

- `COOLIFY_TOKEN`: a Coolify API token.
- `COOLIFY_WEBHOOK`: the deploy webhook URL for the Coolify resource.

The workflow publishes both the mutable `main` tag and an immutable `sha-<commit>` tag. Coolify uses
`main` by default; set `IMAGE_TAG` to a SHA tag to roll back to a specific build.
