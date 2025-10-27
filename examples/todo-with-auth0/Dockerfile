# Base stage: Minimal node image with corepack enabled
FROM node:22.18.0-alpine AS base
RUN apk add --no-cache tini

ENTRYPOINT ["/sbin/tini", "--"]

# Dependency installation stage
FROM base AS build
WORKDIR /usr/src/app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV CI=true
ENV COREPACK_DEFAULT_TO_LATEST=0
RUN corepack enable

# Copy only necessary files for dependency installation
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/backend/prisma/schema.prisma ./apps/backend/prisma/schema.prisma
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc ./

# Install dependencies for backend
RUN pnpm install --frozen-lockfile --filter=@prisma-crud/backend...

# Copy application source code
COPY apps/backend ./apps/backend

# Build the project
RUN pnpm turbo run @prisma-crud/backend#build

# Deploy production-ready app
RUN pnpm --filter=@prisma-crud/backend deploy --prod /prod/backend --legacy

# Copy Prisma schemas into the deployed node_modules
RUN find . -path '*/node_modules/.pnpm/@prisma+client*/node_modules/.prisma/client' | xargs -r -I{} sh -c "rm -rf /prod/backend/{} && cp -R {} /prod/backend/{}"

# Final production stage
FROM base AS production
WORKDIR /app

# Copy the deployed app from the build stage
COPY --from=build /prod/backend .

# Expose the port your app listens on
EXPOSE 3000

# Set the user to node
USER node

# Set health check (optional, modify according to your app's health endpoint)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/healthz || exit 1

# Start the application
CMD ["node", "dist/index.js"]
