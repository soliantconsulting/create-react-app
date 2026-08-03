#!/usr/bin/env node

import {
    createAwsEnvTask,
    createBitbucketRepositoryTask,
    createDeployRoleTask,
    createGitTask,
    createPnpmVersionTask,
    createProjectTask,
    createSentryTask,
    runPipeline,
} from "@soliantconsulting/starter-lib";
import { featuresTask } from "./tasks/features.js";
import { sentryVariableTask } from "./tasks/sentry-variable.js";
import { stagingDomainTask } from "./tasks/staging-domain.js";
import { synthTask } from "./tasks/synth.js";

await runPipeline({
    packageName: "@soliantconsulting/create-react-app",
    tasks: [
        createPnpmVersionTask("11.0.0"),
        createProjectTask(),
        createAwsEnvTask(),
        createBitbucketRepositoryTask(),
        createDeployRoleTask(),
        stagingDomainTask,
        createSentryTask({ projectPlatform: "javascript-react" }),
        sentryVariableTask,
        featuresTask,
        synthTask,
        createGitTask(),
    ],
});
