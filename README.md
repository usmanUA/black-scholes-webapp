# Black-Scholes Derivatives Web Application
A simple Web Application using Infrastructure as Code (IaC)  
**Cloud Provider:** AWS (Free Tier)  
**IaC Tool:** AWS CDK (TypeScript)

## 📖 Overview
This project implements a simple web application which computes (backend) and visualizes (frontend) numerical errors in Black-Scholes derivative pricing methods.
The numerical errors are produced validating stable analytic greeks against the ones computed with:
1. classical finite-differences
2. complex-step differentiation 
The main objective of the project is to demonstrate reproducible cloud deployment using Infrastructure as Code (IaC).

## Architecture
- **Frontend:** Vite + React + TypeScript hosted on S3 static website
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
| FrontendBucket | S3 (static website hosting) | Hosts compiled frontend build |
| BackendServer | EC2 (Amazon Linux 2023) | Runs Dockerized backend container |
| ElasticIP | Elastic IP | Provides static public IP for backend |
| ECR Repository | Elastic Container Registry | Stores backend Docker image |
| IAM Role | EC2Role | Grants EC2 permission to pull ECR images & use SSM |
| Security Group | AppSecurityGroup | Allows SSH (22) + HTTP (8080) inbound |
| (optional) | CloudFront | (Planned) Global CDN distribution for frontend |

## Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + TypeScript + TailwindCSS |
| Backend | TypeScript + C++ + Python (+ Bash orchestration) |
| Infrastructure | AWS CDK v2 (TypeScript) |
| Containerization | Docker + ECR |
| Visualization | Matplotlib |
| OS tested | macOS Sequoia 15.x (cross-platform compatible) |

## Deployment Instructions
### 1. Prerequisites
Install:
```bash
# Node.js 18+ and AWS CLI
npm install -g aws-cdk
aws configure   # set credentials and default region (eu-north-1)

# (Optional) Create key pair for SSH into backend
aws ec2 create-key-pair --key-name backend-key --query 'KeyMaterial' --output text > backend-key.pem
chmod 400 backend-key.pem
```

### 2. Clone the repository
```bash
git clone https://github.com/usmanUA/black-scholes-webapp.git
cd black-scholes-webapp/infra
npm install
```

### 3. Deploy infrastructure
```bash
cdk deploy
```

After ~2–3 minutes, note the Outputs:
```
InfraStack.FrontendBucketName = black-scholes-frontend-<account>
InfraStack.BackendElasticIP   = <your-static-backend-ip>
```

**Note:** The backend uses an Elastic IP that remains constant across deployments. You only need to configure the frontend endpoint once.

### 4. Configure frontend to point to backend

Create `.env.production` before building:
```
VITE_BACKEND_URL=http://<BackendElasticIP>:8080
```

### 5. Deploy frontend
```bash
cd ../frontend
npm install
npm run build
aws s3 sync dist s3://black-scholes-frontend-<account> --delete
aws s3 website s3://black-scholes-frontend-/ --index-document index.html
```

The site will be accessible at:
```
http://black-scholes-frontend-<account>.s3-website.eu-north-1.amazonaws.com
```

## 🧹 Tear Down

When finished:
```bash
cd infra
cdk destroy
```

If deletion fails due to S3 policies:

- Empty the S3 bucket manually from the console.
- Retry `cdk destroy`.

## ⚙️ Notes & Limitations

- **Static Backend IP:** The backend uses an Elastic IP that persists across deployments, so the frontend endpoint remains stable.
- **CloudFront** is currently pending AWS account verification.
- The backend container automatically pulls the latest image from ECR on deployment.
- Frontend can be updated without re-deploying infrastructure using:
```bash
  aws s3 sync dist s3://black-scholes-frontend- --delete
```
- The solution is idempotent — re-deploying CDK does not break or duplicate resources.

## 📊 Deliverables

- Frontend React client (S3)  
- Backend containerized Python + C++ API (EC2 + ECR)  
- Infrastructure as Code (AWS CDK)  
- Documentation (this README)
