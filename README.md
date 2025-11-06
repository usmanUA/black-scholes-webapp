# Black-Scholes Derivatives Web Application
A simple Web Application using Infrastructure as Code (IaC)  
**Cloud Provider:** AWS (Free Tier)  
**IaC Tool:** AWS CDK (TypeScript)

## Overview
This project implements a simple web application which computes (backend) and visualizes (frontend) numerical errors in Black-Scholes derivative pricing methods.
The numerical errors are produced validating stable analytic greeks against the ones computed with:
1. classical finite-differences
2. complex-step differentiation
   
The main objective of the project is to demonstrate reproducible cloud deployment using Infrastructure as Code (IaC).

## Architecture
- **Frontend:** Vite + React + TypeScript hosted on S3 as CloudFront distribution
- **Backend:** Dockerized TypeScript + C++ application hosted on EC2
- **IaC:** AWS CDK provisions all infrastructure

**Data flow:**
1. Frontend sends a request to the backend.
2. Backend executes a Bash script (`run.sh`) that:
   - Compiles and runs a C++ engine for Black-Scholes derivative computations and validation.
   - Produces CSV files of analytic, finite-difference, and complex-step method errors.
   - Runs a Python script to generate two plots (Delta and Gamma) from those CSVs.
3. Backend serves the plots to the frontend, which renders them.

## Infrastructure
| Component | AWS Service | Purpose |
|-----------|-------------|---------|
| FrontendBucket | S3 (CloudFront distribution) | Hosts compiled frontend build |
| BackendServer | EC2 (Amazon Linux 2023) | Runs Dockerized backend container |
| ElasticIP | Elastic IP | Provides static public IP for backend |
| ECR Repository | Elastic Container Registry | Stores backend Docker image |
| IAM Role | EC2Role | Grants EC2 permission to pull ECR images & use SSM |
| Security Group | AppSecurityGroup | Allows SSH (22) + HTTP (80) inbound |

## Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + TypeScript + TailwindCSS |
| Backend | TypeScript + C++ + Python (+ Bash orchestration) |
| Infrastructure | AWS CDK v2 (TypeScript) |
| Containerization | Docker + ECR |
| Visualization | Matplotlib |

## Deployment Instructions
### 1. Prerequisites
- **Node.js 18**
- **AWS CLI (configured with admin priveleges) + AWS CDK v2**
Install:
```bash
npm install -g aws-cdk
aws configure   # set your credentials and default region (eu-north-1) - make sure you have
# root priveleges for necessary IAM roles and permissions
```

### 2. Clone the repository
```bash
git clone https://github.com/usmanUA/black-scholes-webapp.git
cd black-scholes-webapp/infra

# (Optional) Create key pair for SSH into backend to ssh into EC2 remotely
aws ec2 create-key-pair --key-name backend-key --query 'KeyMaterial' --output text > backend-key.pem
chmod 400 backend-key.pem

npm install
```
### 3. Bootstrap the CDK Environment (Once)
Before the first deployment in a new AWS account or region:

```bash
cdk bootstrap aws://<your-account-id>/eu-north-1
```

### 4. Deploy infrastructure
Deploy all backend (EC2 + EIP) and frontend (S3 + CloudFront) resources:

```bash
cdk deploy
```

After ~2–3 minutes, note the CloudFormation Outputs:
```
Outputs:
InfraStack.BackendElasticIP   = <static-backend-ip>
InfraStack.CloudFrontURL      = https://<your-cloudfront-id>.cloudfront.net
InfraStack.FrontendBucketName = black-scholes-frontend-<account-id>
```

**Note:** The backend uses an Elastic IP that remains constant across deployments. You only need to configure the frontend endpoint once.

### 5. Configure frontend to point to backend

Create `.env.production` before building:
```
VITE_BACKEND_URL="https://<your-cloudfront-id>.cloudfront.net"
```
This ensures the frontend routes API calls through CloudFront → DuckDNS → EC2 backend.

### 6. Build and Deploy frontend
```bash
cd ../frontend
npm install
npm run build
aws s3 sync dist s3://black-scholes-frontend-<account-id> --delete
```

CDK already configured CloudFront to serve this bucket, so the app will be live at:
```
https://<your-cloudfront-id>.cloudfront.net
```

### 7. Verify Deployment
- **Frontend**: Open the CloudFront URL in your browser.
- **Backend**: Check backend connectivity with:
- 
```bash
curl -v http://blackscholesapp.duckdns.org/api/run?scenario=1
```

## Tear Down

When finished:
```bash
cd infra
cdk destroy
```

If deletion fails due to S3 or CloudFront propagation detlays:

- Empty the S3 bucket manually from the console.
- Retry `cdk destroy`.

## Notes

- **No manual IAM configuration** is required. CDK provisions roles and policies required for the infrastructure automatically (Root roles and permissions are still required separately.
- **Elastic IP** ensures the backend IP remains constant across redeploys.
- **DuckDNS** maps that IP to a fixed domain (blackscholesapp.duckdns.org), used by CloudFront.
- **CloudFront** provides HTTPS and global caching for the frontend + /api routes.

