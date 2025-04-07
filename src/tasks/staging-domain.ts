import { ACM, CertificateStatus } from "@aws-sdk/client-acm";
import { ListrEnquirerPromptAdapter } from "@listr2/prompt-adapter-enquirer";
import {
    type AwsEnvContext,
    type ProjectContext,
    requireContext,
} from "@soliantconsulting/starter-lib";
import type { ListrTask } from "listr2";

export type StagingDomainContext = {
    stagingDomain: {
        domainName: string;
        certificateArn: string;
    } | null;
};

export const stagingDomainTask: ListrTask<
    Partial<ProjectContext & AwsEnvContext & StagingDomainContext>
> = {
    title: "Configure staging domain",
    task: async (context, task): Promise<void> => {
        const prompt = task.prompt(ListrEnquirerPromptAdapter);
        const awsEnvContext = requireContext(context, "project");

        if (awsEnvContext === null) {
            context.stagingDomain = null;
            task.skip("AWS environment disabled");
            return;
        }

        const domainName = await prompt.run<string>({
            type: "input",
            message: "Domain name:",
        });

        const acm = new ACM({ region: "us-east-1" });
        const result = await acm.listCertificates({
            CertificateStatuses: [CertificateStatus.ISSUED],
        });

        if (!result.CertificateSummaryList || result.CertificateSummaryList.length === 0) {
            throw new Error("No issued certificates found in region us-east-1");
        }

        const matchingCertificates = result.CertificateSummaryList.filter((certificate) => {
            const domainNames = [
                certificate.DomainName,
                ...(certificate.SubjectAlternativeNameSummaries ?? []),
            ];

            if (domainNames.includes(domainName)) {
                return true;
            }

            const parent = domainName.split(".").slice(1).join(".");
            const wildcard = `*.${parent}`;

            return domainNames.includes(wildcard);
        });

        if (matchingCertificates.length === 0) {
            throw new Error("No matching certificates found in region us-east-1");
        }

        const certificateArn = await prompt.run<string>({
            type: "select",
            message: "Certificate:",
            choices: matchingCertificates.map((certificate) => ({
                message: certificate.DomainName,
                name: certificate.CertificateArn,
            })),
        });

        context.stagingDomain = {
            domainName,
            certificateArn,
        };
    },
};
