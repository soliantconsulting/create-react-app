#!/usr/bin/env node

import {
    createAwsEnvTask,
    createBitbucketRepositoryTask,
    createDeployRoleTask,
    createGitTask,
    createPnpmVersionTask,
    createProjectTask,
    runPipeline,
} from "@soliantconsulting/starter-lib";
import { featuresTask } from "./tasks/features.js";
import { stagingDomainTask } from "./tasks/staging-domain.js";
import { synthTask } from "./tasks/synth.js";

await runPipeline({
    packageName: "@soliantconsulting/create-react-app",
    tasks: [
        createPnpmVersionTask("10.15.0"),
        createProjectTask(),
        createAwsEnvTask(),
        createBitbucketRepositoryTask(),
        createDeployRoleTask(),
        stagingDomainTask,
        featuresTask,
        synthTask,
        createGitTask(),
    ],
});
