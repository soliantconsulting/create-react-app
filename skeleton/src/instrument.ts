import * as Sentry from "@sentry/react";

// Must be the first import executed in entry.ts so Sentry's global handlers are
// registered before any application code runs.
if (import.meta.env.VITE_APP_SENTRY_DSN) {
    Sentry.init({
        dsn: import.meta.env.VITE_APP_SENTRY_DSN,
        environment: import.meta.env.VITE_APP_SENTRY_ENVIRONMENT,
        integrations: [
            Sentry.browserTracingIntegration(),
            // Depth 8 reaches the issue trees zod nests inside union and array
            // errors, which the default of 3 renders as `[Array]`. `cause` stays
            // off because the default linkedErrors integration already chains it
            // as a real exception with its own stack.
            Sentry.extraErrorDataIntegration({ depth: 8, captureErrorCause: false }),
        ],
        tracesSampleRate: Number.parseFloat(import.meta.env.VITE_APP_SENTRY_TRACES_SAMPLE_RATE),
        tracePropagationTargets: [import.meta.env.VITE_APP_API_ENDPOINT],
    });
}
