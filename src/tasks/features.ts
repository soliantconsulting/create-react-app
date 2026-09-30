import { ListrEnquirerPromptAdapter } from "@listr2/prompt-adapter-enquirer";
import type { AwsEnvContext, ProjectContext } from "@soliantconsulting/starter-lib";
import type { ListrTask } from "listr2";

type Feature = "auth0" | "cognito";
export type AuthProvider = "auth0" | "cognito";

export type FeaturesContext = {
    features: Feature[];
    auth: AuthProvider | null;
};

export const resolveAuthProvider = (features: readonly Feature[]): AuthProvider | null => {
    const providers = features.filter(
        (feature): feature is AuthProvider => feature === "auth0" || feature === "cognito",
    );

    if (providers.length > 1) {
        throw new Error("Pick either Auth0 or Cognito, not both");
    }

    return providers[0] ?? null;
};

export const featuresTask: ListrTask<Partial<ProjectContext & AwsEnvContext & FeaturesContext>> = {
    title: "Select features",
    task: async (context, task): Promise<void> => {
        const prompt = task.prompt(ListrEnquirerPromptAdapter);

        while (true) {
            const features = await prompt.run<Feature[]>({
                type: "multiselect",
                message: "Features:",
                choices: [
                    { message: "Auth0", name: "auth0" },
                    { message: "Cognito", name: "cognito" },
                ],
            });

            try {
                context.auth = resolveAuthProvider(features);
                context.features = features;
                return;
            } catch (error) {
                task.output = (error as Error).message;
            }
        }
    },
};
