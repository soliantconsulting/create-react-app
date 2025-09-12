import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
    type AwsEnvContext,
    createSynthTask,
    execute,
    type ProjectContext,
} from "@soliantconsulting/starter-lib";
import type { FeaturesContext } from "./features.js";

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
        ignoreList: (context: ProjectContext & Partial<AwsEnvContext & FeaturesContext>) => {
            const list: string[] = [];

            if (!context.awsEnv) {
                list.push("cdk");
                list.push("bitbucket-pipelines.yml.liquid");
            }

            if (!context.features?.includes("auth0")) {
                list.push("src/components/AuthGuard");
                list.push("src/hooks/useAuthenticatedFetch.ts");
            }

            return list;
        },
    },
);
