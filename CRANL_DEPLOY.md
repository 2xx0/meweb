# Cranl deployment

The application is prepared for Cranl with a root `Dockerfile`.

## One-time setup

1. Push this repository to GitHub.
2. In Cranl, connect GitHub and grant access to that repository.
3. Create a project, then create an Application from the repository.
4. Select branch `main`, build type `Dockerfile`, and port `3000`.
5. Add `NEXT_PUBLIC_SITE_URL` with the exact generated `https://*.cranl.net` URL.
6. Deploy again after setting the URL so canonical URLs, sitemap, and robots use it.

The container listens on `0.0.0.0` and reads Cranl's `PORT` environment variable.

## Content administration

The public site deploys with the content committed under `content/`. The current editor at `/admin` is intentionally local-only. Cranl container storage is ephemeral, so writing JSON files from the hosted editor would lose changes after a redeploy.

For hosted content management, create a PostgreSQL database in Cranl and inject `DATABASE_URL` into the application. Add an owner authentication secret through Cranl Environment Variables. Do not commit either secret. The database and authenticated admin integration are the next deployment phase.
