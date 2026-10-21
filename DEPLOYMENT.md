# Deployment

The frontend is hosted on Vercel, the Express API on Render, and production data in Render PostgreSQL. The API creates its tables on startup. Local development continues to use `data/voter_portal.db` when `DATABASE_URL` is not set.

## Deploy the API and database

1. In Render, create a Blueprint from this GitHub repository and use `render.yaml`.
2. Wait for the `voterlist-api` service and `voterlist-postgres` database to be created. The API health check is `/api/health`.
3. Copy the API's public URL for the Vercel configuration.

## Deploy the frontend

1. Import the repository in Vercel. The project uses the root directory, `npm run build`, and `dist`.
2. Set `VITE_API_URL` to the Render API URL, without a trailing slash (for example, `https://voterlist-api.onrender.com`).
3. Deploy the frontend and copy its production origin (for example, `https://your-project.vercel.app`).
4. Set `CORS_ORIGIN` on the Render API to that exact Vercel origin. For a custom domain, include each allowed origin as a comma-separated value. Redeploy the API after changing it.

## Create the first production administrator

The production database starts empty. Do not run the demo `npm run seed` command in production; it inserts publicly documented demo credentials and sample voter records.

In the Render service's Shell, run `npm run bootstrap:admin` after setting these environment variables in the service:

- `BOOTSTRAP_ADMIN_LOGIN_ID`
- `BOOTSTRAP_ADMIN_EMAIL`
- `BOOTSTRAP_ADMIN_NAME`
- `BOOTSTRAP_ADMIN_PASSWORD` (at least 14 characters)

Remove the `BOOTSTRAP_ADMIN_*` variables after the one-time bootstrap. The bootstrap command refuses to create another super-admin when one already exists.

## Required production environment

The Render Blueprint generates `JWT_SECRET` and connects `DATABASE_URL` to PostgreSQL. Keep `DATABASE_SSL=false` only for Render's private database connection. Set `CORS_ORIGIN` to the frontend's exact origin. Never commit production credentials or voter data.

The local SQLite file is intentionally excluded from Git and is not copied to production. Production therefore starts with an empty database until the initial administrator and real records are created through the portal.
