import { ListrEnquirerPromptAdapter } from "@listr2/prompt-adapter-enquirer";
import type { AwsEnvContext, ProjectContext } from "@soliantconsulting/starter-lib";
import type { ListrTask } from "listr2";

export type Feature = "auth0" | "cognito" | "cognito-admin";

type AuthProvider = "none" | "auth0" | "cognito";

export type MfaMode = "required" | "optional" | "off";

export type FeaturesContext = {
    features: Feature[];
    cognitoSettings: {
        /**
         * Managed login domain prefix, suffixed with `-staging` / `-production` per environment.
         */
        domainPrefix: string;
        mfa: MfaMode;
    } | null;
};

// Cognito rejects domain prefixes containing these words.
const reservedDomainWords = ["aws", "amazon", "cognito"];
const longestEnvironmentSuffix = "-production";

export const validateDomainPrefix = (value: string): true | string => {
    if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value)) {
        return "Use lowercase letters, numbers and hyphens, starting and ending with a letter or number";
    }

    const reservedWord = reservedDomainWords.find((word) => value.includes(word));

    if (reservedWord) {
        return `Must not contain "${reservedWord}"`;
    }

    if (value.length + longestEnvironmentSuffix.length > 63) {
        return `Must be at most ${63 - longestEnvironmentSuffix.length} characters`;
    }

    return true;
};

const suggestDomainPrefix = (projectName: string): string =>
    reservedDomainWords
        .reduce((name, word) => name.replaceAll(word, ""), projectName.toLowerCase())
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/-{2,}/g, "-")
        .slice(0, 63 - longestEnvironmentSuffix.length)
        .replace(/^-|-$/g, "");

export const featuresTask: ListrTask<Partial<ProjectContext & AwsEnvContext & FeaturesContext>> = {
    title: "Select features",
    task: async (context, task): Promise<void> => {
        const prompt = task.prompt(ListrEnquirerPromptAdapter);
        const features: Feature[] = [];
        let cognitoSettings: FeaturesContext["cognitoSettings"] = null;

        const authProvider = await prompt.run<AuthProvider>({
            type: "select",
            message: "Authentication:",
            choices: [
                { message: "None", name: "none" },
                { message: "Auth0", name: "auth0" },
                // The Cognito user pool is provisioned by the CDK stack, so it needs an AWS env.
                ...(context.awsEnv
                    ? [{ message: "AWS Cognito (user pool managed by CDK)", name: "cognito" }]
                    : []),
            ],
        });

        if (authProvider === "auth0") {
            features.push("auth0");
        }

        if (authProvider === "cognito") {
            features.push("cognito");

            const includeAdmin = await prompt.run<boolean>({
                type: "toggle",
                message: "Include user admin UI (manage users and assign roles in the app)?",
                initial: true,
            });

            if (includeAdmin) {
                features.push("cognito-admin");
            }

            const domainPrefix = await prompt.run<string>({
                type: "input",
                message: "Cognito login domain prefix (-staging / -production is appended):",
                initial: suggestDomainPrefix(context.project?.name ?? ""),
                validate: validateDomainPrefix,
            });

            const mfa = await prompt.run<MfaMode>({
                type: "select",
                message: "MFA:",
                choices: [
                    { message: "Required (authenticator app)", name: "required" },
                    { message: "Optional (users are not prompted to set it up)", name: "optional" },
                    { message: "Off", name: "off" },
                ],
            });

            cognitoSettings = { domainPrefix, mfa };
        }

        context.features = features;
        context.cognitoSettings = cognitoSettings;
    },
};
