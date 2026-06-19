# ---------------------------------------------------------------------------
# Heroku Procfile
#
# When using Container Registry (Docker) deployments, this Procfile acts as
# a documentation/fallback reference. The actual process commands are baked
# into the Docker image CMD via the PROCESS_TYPE build-arg.
#
# release: runs ONCE before ANY dyno boots on every new release.
#   → Prisma migrate deploy is idempotent and safe to run here.
#   → Heroku waits for the release dyno to exit 0 before routing traffic,
#     which guarantees the schema is up-to-date before the web dyno starts.
#
# web: started automatically by Heroku and receives HTTP traffic.
#   → Heroku injects $PORT; server.ts reads process.env.PORT.
#
# worker: must be manually scaled (heroku ps:scale worker=1) or configured
#   in the Heroku dashboard. It receives no HTTP traffic.
# ---------------------------------------------------------------------------

release: npx prisma migrate deploy
web: node dist/server.js
worker: node dist/workers/worker.server.js
