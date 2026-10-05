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
        postInstall: async (
            context: ProjectContext & Partial<AwsEnvContext & FeaturesContext>,
            task,
        ) => {
            if (context.awsEnv) {
                await execute(task.stdout(), "pnpm", ["install"], {
                    cwd: join(context.project.path, "cdk"),
                });
            }

            if (context.features?.includes("cognito-admin")) {
                // The skeleton's route tree lacks the admin routes; a build regenerates it.
                await execute(task.stdout(), "pnpm", ["vite", "build"], {
                    cwd: context.project.path,
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

            const features = context.features ?? [];

            if (!(features.includes("auth0") || features.includes("cognito"))) {
                list.push("src/components/AuthGuard");
                list.push("src/hooks/useAuthenticatedFetch.ts.liquid");
            }

            if (!features.includes("cognito")) {
                list.push("src/utils/config.ts.liquid");
                list.push("src/utils/signOut.ts");
                list.push("src/components/UserMenu.tsx.liquid");
                list.push("cdk/src/cognito-auth.ts.liquid");
                list.push("cdk/emails");
            }

            if (!features.includes("cognito-admin")) {
                list.push("src/cognito");
                list.push("src/hooks/useIsAdmin.ts");
                list.push("src/queries/admin-*.ts");
                list.push("src/mutations/admin-*.ts");
                list.push("src/routes/admin");
                list.push("src/utils/cognito-error.ts");
            }

            return list;
        },
    },
);
