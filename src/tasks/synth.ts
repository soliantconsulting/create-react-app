import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
    type AwsEnvContext,
    createSynthTask,
    execute,
    type ProjectContext,
    type SentryContext,
} from "@soliantconsulting/starter-lib";
import type { FeaturesContext } from "./features.js";
import type { StagingDomainContext } from "./staging-domain.js";

export const synthTask = createSynthTask(
    fileURLToPath(new URL("../../skeleton", import.meta.url)),
    {
        postInstall: async (context: ProjectContext & Partial<AwsEnvContext>, task) => {
            if (context.awsEnv) {
                await execute(task.stdout(), "pnpm", ["install"], {
                    cwd: join(context.project.path, "cdk"),
                });
            }
        },
        ignoreList: (
            context: ProjectContext &
                Partial<AwsEnvContext & FeaturesContext & StagingDomainContext & SentryContext>,
        ) => {
            const list: string[] = [];

            if (!context.sentry) {
                list.push("src/instrument.ts");
            }

            if (!context.awsEnv) {
                list.push("cdk");
                list.push("bitbucket-pipelines.yml.liquid");
            }

            if (!context.stagingDomain) {
                list.push(".sld-dns-control.json.liquid");
            }

            if (!context.features?.includes("auth0")) {
                list.push("src/components/AuthGuard");
                list.push("src/hooks/useAuthenticatedFetch.ts");
            }

            return list;
        },
    },
);
