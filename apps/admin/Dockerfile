FROM node:22-alpine AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

FROM base AS build

WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/admin/package.json apps/admin/
COPY packages/protocol/package.json packages/protocol/
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY packages/protocol packages/protocol
COPY apps/admin apps/admin

RUN pnpm --filter admin run build

FROM base AS runtime

ENV NODE_ENV=production

RUN addgroup -S -g 1001 bela && adduser -S -u 1001 -G bela bela

WORKDIR /app

COPY --from=build --chown=bela:bela /repo/apps/admin/.next/standalone ./
COPY --from=build --chown=bela:bela /repo/apps/admin/.next/static ./apps/admin/.next/static

USER bela

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/admin/server.js"]
