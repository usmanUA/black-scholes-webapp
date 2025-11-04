import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // NOTE: BACKEND SETUP
    const ec2Role = new iam.Role(this, "EC2Role", {
	    assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
	    managedPolicies: [
		iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"),
		iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2ContainerRegistryReadOnly")
	    ],
	});

    // NOTE: DOCKER INSTALLATION AND APP SETUP
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      "yum update -y",
      "yum install -y docker",
      "systemctl enable docker",
      "systemctl start docker",
      "sleep 10",
      "aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin 791736278137.dkr.ecr.eu-north-1.amazonaws.com",
      "docker pull 791736278137.dkr.ecr.eu-north-1.amazonaws.com/black-scholes-backend:latest",
      "docker run -d -p 80:8080 -e FRONTEND_ORIGIN='*' 791736278137.dkr.ecr.eu-north-1.amazonaws.com/black-scholes-backend:latest"
    )

    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVPC', { isDefault: true });

    const sg = new ec2.SecurityGroup(this, 'AppSecurityGroup', {
	    vpc,
	    allowAllOutbound: true,
	    description: 'Allow SSH and HTTP'
	});

    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH');
    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP');

    const ec2Instance = new ec2.Instance(this, 'BackendServer', {
	    vpc,
	    instanceType: new ec2.InstanceType('t3.micro'),
	    machineImage: ec2.MachineImage.latestAmazonLinux2023({
		cpuType: ec2.AmazonLinuxCpuType.X86_64
	    }),
	    securityGroup: sg,
	    keyName: 'backend-key',
	    userData: userData,
	    role: ec2Role
	});

    // NOTE: ASSOCIATE STATIC IP
    const eipAllocId = "eipalloc-054f193b4de84bd5f";
	new ec2.CfnEIPAssociation(this, "EIPAssociation", {
	    allocationId: eipAllocId,
	    instanceId: ec2Instance.instanceId
	});

    new cdk.CfnOutput(this, "BackendEIP", {
	    value: "13.62.107.53",
	    description: "Static IP for backend"
	});

    new cdk.CfnOutput(this, 'InstancePublicIP', {
	value: ec2Instance.instancePublicIp
    });

    // NOTE: FRONTEND SETUP
    const siteBucket = new s3.Bucket(this, "FrontendBucket", {
	    bucketName: `black-scholes-frontend-${this.account}`,
	    websiteIndexDocument: 'index.html',
	    publicReadAccess: true,
	    blockPublicAccess: new s3.BlockPublicAccess({
		blockPublicAcls: false,
		ignorePublicAcls: false,
		blockPublicPolicy: false,
		restrictPublicBuckets: false
	    }),
	    removalPolicy: cdk.RemovalPolicy.DESTROY,
	    autoDeleteObjects: true
	});

    siteBucket.addToResourcePolicy(new iam.PolicyStatement({
	    actions: [
		's3:GetBucketTagging',
		's3:GetBucketVersioning',
		's3:GetLifecycleConfiguration',
		's3:ListBucket',
		"s3:DeleteObject"
	    ],
	    resources: [siteBucket.bucketArn, `${siteBucket.bucketArn}/*`],
	    principals: [new iam.ServicePrincipal("lambda.amazonaws.com")]
	}));

    const apiOrigin = new origins.HttpOrigin("blackscholesapp.duckdns.org", {
	    protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
	    httpPort: 80
	});

    const distribution = new cloudfront.Distribution(this, "FrontendDistribution", {
	    defaultBehavior: {
		origin: new origins.S3Origin(siteBucket),
		viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
	    },
	    additionalBehaviors: {
		"api/*": {
		    origin: apiOrigin,
		    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
		}
	    },
	    defaultRootObject: "index.html",
	    errorResponses: [
		{
		    httpStatus: 403,
		    responseHttpStatus: 200,
		    responsePagePath: "/index.html",
		    ttl: cdk.Duration.minutes(5)
		},
		{
		    httpStatus: 404,
		    responseHttpStatus: 200,
		    responsePagePath: "/index.html",
		    ttl: cdk.Duration.minutes(5)
		}
	    ]
	});

    new s3deploy.BucketDeployment(this, "DeployFrontend", {
	    sources: [s3deploy.Source.asset("../frontend/dist")],
	    destinationBucket: siteBucket,
	    distribution,
	    distributionPaths: ["/*"]
    });

    new cdk.CfnOutput(this, "FrontendBucketName", { value: siteBucket.bucketName });
    new cdk.CfnOutput(this, "CloudFrontURL", {
	    value: `https://${distribution.distributionDomainName}`
	});
  }
}
