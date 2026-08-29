# Built from the repository root, not this directory: the workspace files and `@bela/protocol`
# both live above it, and pnpm needs the whole workspace to resolve a `workspace:*` dependency.
FROM node:22-alpine AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

FROM base AS build

WORKDIR /repo

# Manifests first so the install layer is keyed on dependencies alone and survives source edits.
#
# --ignore-scripts because apps/web's postinstall reads src/lib/i18n/countries.ts, which is not
# here yet. It is run deliberately below, once the source exists.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/protocol/package.json packages/protocol/
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY packages/protocol packages/protocol
COPY apps/web apps/web

# The postinstall that was skipped above. It copies ~200 flag SVGs out of @twemoji/svg into
# public/flags, which is gitignored and so exists in no build context — skip it and every flag
# in the app renders broken.
RUN pnpm --filter web run flags

# Baked into the client bundle at build time, which is what makes this image environment-specific.
# Passing them at run time would be silently too late: the browser would get whatever was compiled
# in, and with nothing set that is localhost:8080.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

# devDependencies are still installed on purpose: reactCompiler needs babel-plugin-react-compiler,
# which is one of them, so pruning before the build produces an image that fails to compile.
RUN pnpm --filter web run build

FROM base AS runtime

ENV NODE_ENV=production

RUN addgroup -S -g 1001 bela && adduser -S -u 1001 -G bela bela

WORKDIR /app

# The standalone output is nested under apps/web because tracing starts at the workspace root.
# static and public are not part of it and have to be placed alongside by hand.
COPY --from=build --chown=bela:bela /repo/apps/web/.next/standalone ./
COPY --from=build --chown=bela:bela /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=bela:bela /repo/apps/web/public ./apps/web/public

USER bela

EXPOSE 3000

ENV PORT=3000
# Without this the server binds to localhost inside the container and nothing outside can reach it.
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/web/server.js"]
