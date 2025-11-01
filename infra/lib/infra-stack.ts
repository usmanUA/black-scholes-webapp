import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';
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

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      "yum update -y",
      "yum install -y docker",
      "systemctl enable docker",
      "systemctl start docker",
      "sleep 10",
      "aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin 791736278137.dkr.ecr.eu-north-1.amazonaws.com",
      "docker pull 791736278137.dkr.ecr.eu-north-1.amazonaws.com/black-scholes-backend:latest",
      "docker run -d -p 8080:8080 -e FRONTEND_ORIGIN='*' 791736278137.dkr.ecr.eu-north-1.amazonaws.com/black-scholes-backend:latest"
    )
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVPC', { isDefault: true });

    const sg = new ec2.SecurityGroup(this, 'AppSecurityGroup', {
	    vpc,
	    allowAllOutbound: true,
	    description: 'Allow SSH and HTTP'
	});

    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH');
    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(8080), 'Allow HTTP');

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

    const eip = new ec2.CfnEIP(this, "BackendEIP", {
	    domain: "vpc"
	});

    new ec2.CfnEIPAssociation(this, "EIPAssociation", {
	    eip: eip.ref,
	    instanceId: ec2Instance.instanceId
	});

    new cdk.CfnOutput(this, "BackendElasticIP", {
	    value: eip.ref,
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
    new cdk.CfnOutput(this, "FrontendBucketName", { value: siteBucket.bucketName });
  }
}
