import type {StackProps} from 'aws-cdk-lib';
import {Stack} from 'aws-cdk-lib';
import {S3Trigger} from 'aws-cdk-lib/aws-codepipeline-actions';
import {Bucket} from 'aws-cdk-lib/aws-s3';
import {CodePipeline, CodePipelineSource, ManualApprovalStep, ShellStep,} from 'aws-cdk-lib/pipelines';
import type {Construct} from 'constructs';
import {AppStage} from './app-stage';

export class CiCdStack extends Stack {
    public constructor(scope : Construct, id : string, props ?: StackProps) {
        super(scope, id, props);

        /**
         * @todo Install `bitbucket-code-pipeline-integration` and fill in the placeholder values here.
         * @see https://github.com/DASPRiD/bitbucket-code-pipeline-integration
         */
        const sourceBucket = Bucket.fromBucketName(
            this,
            'SourceBucket',
            '{{ source-bucket-name }}',
        );
        /**
         * @todo Fill in your repository values. By default, branch should be "main".
         */
        const sourceObjectKey = '{{ project-key }}/{{ repository-name }}/{{ branch }}.zip';

        const pipeline = new CodePipeline(this, 'Pipeline', {
            synth: new ShellStep('Synth', {
                input: CodePipelineSource.s3(sourceBucket, sourceObjectKey, {trigger: S3Trigger.EVENTS}),
                commands: [
                    'npm ci',
                    'cd cdk',
                    'npm ci',
                    'npm run build',
                    'npx cdk synth',
                ],
                primaryOutputDirectory: 'cdk/cdk.out',
            }),
            dockerEnabledForSynth: true,
        });

        /**
         * @todo Create certificates for both UAT and prod in the region you want to deploy in.
         */
        pipeline.addStage(new AppStage(this, '{{ name }}-uat', {
            env: {account: '{{ account-id }}', region: '{{ region }}'},
            certificateArn: '{{ uat-acm-certificate-arn }}',
            domainName: '{{ uat-domain-name }}',
            buildEnv: {
                VITE_APP_MY_VARIABLE: 'foo',
            },
        }));

        pipeline.addStage(new AppStage(this, '{{ name }}-prod', {
            env: {account: '{{ account-id }}', region: '{{ region }}'},
            certificateArn: '{{ prod-acm-certificate-arn }}',
            domainName: '{{ prod-domain-name }}',
            buildEnv: {
                VITE_APP_MY_VARIABLE: 'bar',
            },
        }), {
            pre: [
                new ManualApprovalStep('PromoteToProd'),
            ],
        });
    }
}
