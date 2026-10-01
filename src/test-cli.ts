#!/usr/bin/env node

import { fileURLToPath } from "node:url";
import {
    type AwsEnvContext,
    type DeployRoleContext,
    type ProjectContext,
    runPipeline,
    type SentryContext,
} from "@soliantconsulting/starter-lib";
import type { FeaturesContext } from "./tasks/features.js";
import type { StagingDomainContext } from "./tasks/staging-domain.js";
import { synthTask } from "./tasks/synth.js";

const variant = process.argv[2];
const cognito = variant === "cognito";
const noauth = variant === "noauth";
const directory = cognito ? "test-synth-cognito" : noauth ? "test-synth-noauth" : "test-synth";

type BaseContext = ProjectContext &
    AwsEnvContext &
    DeployRoleContext &
    FeaturesContext &
    StagingDomainContext &
    SentryContext;

await runPipeline({
    packageName: "@soliantconsulting/create-react-app",
    tasks: [synthTask],
    baseContext: {
        project: {
            name: directory,
            title: "Test Synth",
            path: fileURLToPath(new URL(`../${directory}`, import.meta.url)),
        },
        awsEnv: {
            accountId: "123456789",
            region: "us-east-1",
        },
        deployRole: {
            arn: "arn://unknown",
        },
        stagingDomain: {
            domainName: "example.com",
            certificateArn: "arn://example",
        },
        sentry: {
            org: "soliant-consulting-inc",
            projectSlug: "test-synth",
            dsn: "https://examplePublicKey@o0.ingest.sentry.io/0",
            authToken: "sntrys_example",
            authTokenId: "0",
        },
        auth: noauth ? null : cognito ? "cognito" : "auth0",
    } satisfies BaseContext,
});
