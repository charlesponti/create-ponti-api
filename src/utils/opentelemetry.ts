/* eslint-disable */
import { HttpTraceContextPropagator } from "@opentelemetry/core";
import { AsyncHooksContextManager } from "@opentelemetry/context-async-hooks";
import { CollectorTraceExporter } from "@opentelemetry/exporter-collector";
import { Resource } from "@opentelemetry/resources";

import { NodeTracerProvider } from "@opentelemetry/node";

import {
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/tracing";

const SERVICE_NAME = process.env.SERVICE_NAME;

if (!SERVICE_NAME) {
  throw new Error('Missing SERVICE_NAME for Lightstep')
}

const provider = new NodeTracerProvider({
  resource: new Resource({
    "service.name": SERVICE_NAME,
    "service.version": (process.env.RAILWAY_GIT_COMMIT_SHA as string) || "dev",
  }),
});

if (process.env.LIGHTSTEP_EXPORTER === "true") {
  console.log("Lightstep exporter enabled");
  provider.addSpanProcessor(
    new SimpleSpanProcessor(
      new CollectorTraceExporter({
        url: "https://ingest.lightstep.com:443/api/v2/otel/trace",
        headers: {
          "Lightstep-Access-Token": process.env.LS_ACCESS_TOKEN,
        },
      })
    )
  );
}

if (process.env.JAEGER_EXPORTER === "true") {
  console.log("Jaeger exporter enabled");
  const { JaegerExporter } = require("@opentelemetry/exporter-jaeger");
  const exporter = provider.addSpanProcessor(
    new SimpleSpanProcessor(
      new JaegerExporter({
        serviceName: SERVICE_NAME,
        endpoint: "http://localhost:14268/api/traces",
      })
    )
  );
}

if (process.env.CONSOLE_EXPORTER === "true") {
  // Emits traces to the console for debugging
  console.log("Console span exporter enabled");
  provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
}

provider.register({
  contextManager: new AsyncHooksContextManager().enable(),
  propagator: new HttpTraceContextPropagator(),
});

export default provider;
