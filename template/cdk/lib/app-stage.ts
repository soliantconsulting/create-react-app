import type {StageProps} from 'aws-cdk-lib';
import {Stage} from 'aws-cdk-lib';
import type {Construct} from 'constructs';
import {CloudfrontStack} from './cloudfront-stack';

type AppStageProps = StageProps & {
    certificateArn : string;
    domainName : string;
};

export class AppStage extends Stage {
    public constructor(scope : Construct, id : string, props : AppStageProps) {
        super(scope, id, props);

        new CloudfrontStack(this, 'cloudfront', {
            certificateArn: props.certificateArn,
            domainName: props.domainName,
        });
    }
}
