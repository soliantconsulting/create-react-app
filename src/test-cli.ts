#!/usr/bin/env node

import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
    type AwsEnvContext,
    type DeployRoleContext,
    type ProjectContext,
    runPipeline,
    type SentryContext,
} from "@soliantconsulting/starter-lib";
import type { Feature, FeaturesContext, MfaMode } from "./tasks/features.js";
import type { StagingDomainContext } from "./tasks/staging-domain.js";
import { synthTask } from "./tasks/synth.js";

type BaseContext = ProjectContext &
    AwsEnvContext &
    DeployRoleContext &
    FeaturesContext &
    StagingDomainContext &
    SentryContext;

const presets = {
    none: { features: [] },
    auth0: { features: ["auth0"] },
    cognito: { features: ["cognito"] },
    "cognito-admin": { features: ["cognito", "cognito-admin"] },
    "cognito-admin-mfa-optional": { features: ["cognito", "cognito-admin"], mfa: "optional" },
    "cognito-admin-mfa-off": { features: ["cognito", "cognito-admin"], mfa: "off" },
} satisfies Record<string, { features: Feature[]; mfa?: MfaMode }>;

const presetName = process.argv[2] ?? "auth0";

if (!Object.hasOwn(presets, presetName)) {
    throw new Error(
        `Unknown preset "${presetName}", expected one of: ${Object.keys(presets).join(", ")}`,
    );
}

const preset: { features: Feature[]; mfa?: MfaMode } = presets[presetName as keyof typeof presets];
const features = preset.features;
const path = fileURLToPath(new URL(`../test-synth-${presetName}`, import.meta.url));

await rm(path, { recursive: true, force: true });

await runPipeline({
    packageName: "@soliantconsulting/create-react-app",
    tasks: [synthTask],
    baseContext: {
        project: {
            name: `test-synth-${presetName}`,
            title: "Test Synth",
            path,
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
            projectSlug: `test-synth-${presetName}`,
            dsn: "https://examplePublicKey@o0.ingest.sentry.io/0",
            authToken: "sntrys_example",
            authTokenId: "0",
        },
        features,
        cognitoSettings: features.some((feature) => feature === "cognito")
            ? { domainPrefix: "test-synth-login", mfa: preset.mfa ?? "required" }
            : null,
    } satisfies BaseContext,
});
