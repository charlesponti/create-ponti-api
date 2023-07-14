# Fastify & Prisma Server

This repo uses the following technologies:

- [**Fastify**](https://www.fastify.io/): Fast and low overhead web framework, for Node.js
- [**fastify-csrf**](https://github.com/fastify/fastify-csrf): Protect against CSRF attacks
- [**fastify-secure-session**](https://github.com/fastify/fastify-secure-session): Session cookie management
- [**fastify-circuit-breaker**](https://www.fastify.io/): Provide [_circuit breaker_](https://martinfowler.com/bliki/CircuitBreaker.html) architecture
- [**Prisma**](https://www.prisma.io/): Next-generation ORM for type-safe interaction with the database
- [**PostgreSQL**](https://www.postgresql.org/): powerful, open source object-relational database system with over 30 years of active development.
<!-- - [**Sentry**](https://sentry.io/): an error tracking and monitoring tool. -->
- [**OpenTelemetry Tracing**](https://opentelemetry.io/): An observability framework for cloud-native software. Configured to trace HTTP requests and Prisma queries.

The project attempts to maintain a high degree of type-safety by leveraging TypeScript and Prisma.

## DB Schema

The database schema is defined using the [Prisma schema](./prisma/schema.prisma) which defines 1 model:

- User

## Getting started

### Prerequisites

- A PostgreSQL DB

### Steps

1. clone repo
2. create `.env` file from `.env.example`
3. Define `DATABASE_URL`
4. Define `COOKIE_NAME`
5. Generate and define `COOKIE_SECRET`
6. Generate and define `COOKIE_SALT`
7. Define schema in `prisma/schema.prisma`
8. `npm install`
9. `pnpm migrate:dev` to run schema migrations with [Prisma Migrate](https://www.prisma.io/migrate)
10. `pnpm dev` to start dev server and run the API

## Tracing

The server is instrumented with OpenTelemetry tracing.

Here's how it works:

- `@autorelic/fastify-opentelemetry` is a plugin that creates a root span for every fastify HTTP request and allows creating child spans using `request.openTelemetry()`
- Additional spans for Prisma Client queries are created through `context.request.openTelemetry()`.

### Example trace

![trace example](https://user-images.githubusercontent.com/1992255/123289101-6c69d400-d510-11eb-9154-8aa0bdb8d10c.png)

### Viewing traces in local development with Jaeger

You can view traces in local development using [Jaeger](https://www.jaegertracing.io/).

1. Start jaeger by going into the [tracing](./tracing) folder and running `docker compose up -d`
2. In your `.env` file set `JAEGER_EXPORTER="true"`
3. Open the Jaeger UI: `http://localhost:16686/`
