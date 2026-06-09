# syntax=docker/dockerfile:1

FROM oven/bun:1.3.5 AS deps
WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends python3 make g++ \
	&& rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
COPY apps/admin/package.json apps/admin/package.json
COPY apps/platform/package.json apps/platform/package.json
COPY packages/config-eslint/package.json packages/config-eslint/package.json
RUN bun install --frozen-lockfile --ignore-scripts

FROM deps AS build
ARG APP
ARG PUBLIC_ACME
ARG PUBLIC_BASE_PATH
ARG PUBLIC_PB_URL
ARG PUBLIC_PLATFORM_URL
ARG PUBLIC_USER_BIRTHDAY
ARG PUBLIC_USER_COUNTRY
ARG PUBLIC_USER_DEPARTMENT
ARG PUBLIC_USER_OCCUPATION

ENV NODE_ENV=production \
	PUBLIC_ACME=${PUBLIC_ACME} \
	PUBLIC_BASE_PATH=${PUBLIC_BASE_PATH} \
	PUBLIC_PB_URL=${PUBLIC_PB_URL} \
	PUBLIC_PLATFORM_URL=${PUBLIC_PLATFORM_URL} \
	PUBLIC_USER_BIRTHDAY=${PUBLIC_USER_BIRTHDAY} \
	PUBLIC_USER_COUNTRY=${PUBLIC_USER_COUNTRY} \
	PUBLIC_USER_DEPARTMENT=${PUBLIC_USER_DEPARTMENT} \
	PUBLIC_USER_OCCUPATION=${PUBLIC_USER_OCCUPATION}

COPY . .
RUN test "${APP}" = "admin" -o "${APP}" = "platform" && bun run --filter ${APP} build

FROM oven/bun:1.3.5 AS runner
WORKDIR /app

ARG APP
ENV NODE_ENV=production \
	HOST=0.0.0.0 \
	PORT=3000

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/${APP}/build ./build
COPY --from=build /app/apps/${APP}/package.json ./package.json

EXPOSE 3000
CMD ["bun", "build/index.js"]
