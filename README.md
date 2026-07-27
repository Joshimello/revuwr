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

Production images are built by `.github/workflows/publish-images.yml` and published to:

- `ghcr.io/joshimello/revuwr-admin:main`
- `ghcr.io/joshimello/revuwr-platform:main`

Create one Docker Image resource in Coolify for each image and keep the existing runtime environment
variables configured on the corresponding resource. Redeploy the resources manually after a new
image has been published. Coolify does not need access to the source repository.

The GitHub repository must define the public build-time variables referenced by the workflow. The
GHCR packages must either be public or accessible to the Coolify server through registry
credentials.

The workflow publishes both the mutable `main` tag and an immutable `sha-<commit>` tag. Use the
`main` tag for regular deployments or a SHA tag to roll back to a specific build.

`docker-compose.production.yml` provides the same prebuilt-image setup when a Compose deployment is
preferred.
