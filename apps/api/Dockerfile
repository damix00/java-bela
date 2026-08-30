# Build and runtime are both pinned to Java 25: the toolchain in build.gradle asks for it, and
# the daemon JVM is pinned alongside it because the TypeScript generator reads compiled classes.
# --no-daemon sidesteps that second concern entirely here, but the version still has to match.
FROM eclipse-temurin:25-jdk AS build

WORKDIR /build

# Dependency resolution is its own layer, keyed on the build files alone, so editing a source file
# does not re-download the world on every image build.
COPY gradle gradle
COPY gradlew settings.gradle build.gradle ./
RUN chmod +x gradlew && ./gradlew --no-daemon dependencies --configuration runtimeClasspath

COPY src src

# bootJar rather than build: the test task needs Postgres and Redis, and CI has already run it
# against real ones. A container build is the wrong place to discover that.
RUN ./gradlew --no-daemon bootJar -x test

FROM eclipse-temurin:25-jre AS runtime

# An unprivileged user, created rather than assumed — the JRE image has no non-root user of its own.
RUN groupadd --system --gid 1001 bela \
    && useradd --system --uid 1001 --gid bela bela

WORKDIR /app

COPY --from=build --chown=bela:bela /build/build/libs/*.jar app.jar

USER bela

EXPOSE 8080

# MaxRAMPercentage rather than a fixed -Xmx: the JVM otherwise sizes the heap against the host's
# memory rather than the container's limit, and two instances overlap during a deploy.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75"

# The profile belongs to the image, not just to the deploy that runs it. Leaving it to the
# environment makes forgetting it a silent failure rather than a loud one: the CORS beans are
# @Profile-gated, so with no profile active neither registers and there is no CORS mapping at
# all. The container still starts and still passes its health check — it just cannot be reached
# from a browser. Overridable at runtime for anyone who wants a different profile.
ENV SPRING_PROFILES_ACTIVE=prod

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
