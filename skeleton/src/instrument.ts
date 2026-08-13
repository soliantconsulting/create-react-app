import * as Sentry from "@sentry/react";

// Must be the first import executed in entry.ts so Sentry's global handlers are
// registered before any application code runs.
if (import.meta.env.VITE_APP_SENTRY_DSN) {
    Sentry.init({
        dsn: import.meta.env.VITE_APP_SENTRY_DSN,
        environment: import.meta.env.VITE_APP_SENTRY_ENVIRONMENT,
        integrations: [Sentry.browserTracingIntegration()],
        tracesSampleRate: Number.parseFloat(import.meta.env.VITE_APP_SENTRY_TRACES_SAMPLE_RATE),
        tracePropagationTargets: [import.meta.env.VITE_APP_API_ENDPOINT],
    });
}
