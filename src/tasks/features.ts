import { ListrEnquirerPromptAdapter } from "@listr2/prompt-adapter-enquirer";
import type { AwsEnvContext, ProjectContext } from "@soliantconsulting/starter-lib";
import type { ListrTask } from "listr2";

type AuthProvider = "auth0" | "cognito";

export type FeaturesContext = {
    auth: AuthProvider | null;
};

export const resolveAuthProvider = (features: readonly AuthProvider[]): AuthProvider | null => {
    if (features.length > 1) {
        throw new Error("Pick either Auth0 or Cognito, not both");
    }

    return features[0] ?? null;
};

export const featuresTask: ListrTask<Partial<ProjectContext & AwsEnvContext & FeaturesContext>> = {
    title: "Select features",
    task: async (context, task): Promise<void> => {
        const prompt = task.prompt(ListrEnquirerPromptAdapter);
        const features = await prompt.run<AuthProvider[]>({
            type: "multiselect",
            message: "Features:",
            choices: [
                { message: "Auth0", name: "auth0" },
                { message: "Cognito", name: "cognito" },
            ],
            validate: (value: AuthProvider[]) => {
                try {
                    resolveAuthProvider(value);
                    return true;
                } catch (error) {
                    return error instanceof Error ? error.message : false;
                }
            },
        });

        context.auth = resolveAuthProvider(features);
    },
};
