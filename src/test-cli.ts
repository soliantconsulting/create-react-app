#!/usr/bin/env node

import { rm } from "fs/promises";
import meow from "meow";
import "source-map-support/register.js";
import { synthProject } from "./synth.js";

const cli = meow(
    `
  Usage

    $ npm run test-synth [path|-v|--version|-h|--help]
`,
    {
        booleanDefault: undefined,
        flags: {
            help: {
                type: "boolean",
                shortFlag: "h",
            },
            version: {
                type: "boolean",
                shortFlag: "v",
            },
        },
        importMeta: import.meta,
    },
);

const [path] = cli.input;

await rm(path, { recursive: true, force: true });
await synthProject(
    path,
    {
        accountId: "0",
        region: "us-east-1",
        deployRoleArn: "arn://unknown",
        appName: "react-app-test",
        appTitle: "React App Test",
        features: [],
        stagingCertificateArn: "arn://unknown",
        stagingDomainName: "unknown",
    },
    process.stdout,
    false,
);
