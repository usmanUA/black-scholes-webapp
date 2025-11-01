# 🧮 Black-Scholes Derivatives Web Application
A simple Web Application using Infrastructure as Code (IaC)  
**Cloud Provider:** AWS (Free Tier)  
**IaC Tool:** AWS CDK (TypeScript)

## 📖 Overview
This project implements a two-tier web application for computing and visualizing numerical errors in Black-Scholes derivative pricing methods.
It demonstrates reproducible cloud deployment using Infrastructure as Code (IaC).

## 🧩 Architecture
- **Frontend:** Vite + React + TypeScript hosted on S3 static website
- **Backend:** Dockerized Python + C++ application hosted on EC2
- **IaC:** AWS CDK provisions all infrastructure

**Data flow:**
1. Frontend sends a request to the backend.
2. Backend executes a Bash script (`run.sh`) that:
   - Compiles and runs a C++ engine for Black-Scholes derivative computations.
   - Produces CSV files of analytic, finite-difference, and complex-step method errors.
   - Runs a Python script to generate two plots from those CSVs.
3. Backend serves the plots to the frontend, which renders them.

## 🧱 Infrastructure
| Component | AWS Service | Purpose |
|-----------|-------------|---------|
| FrontendBucket | S3 (static website hosting) | Hosts compiled frontend build |
| BackendServer | EC2 (Amazon Linux 2023) | Runs Dockerized backend container |
| ElasticIP | Elastic IP | Provides static public IP for backend |
| ECR Repository | Elastic Container Registry | Stores backend Docker image |
| IAM Role | EC2Role | Grants EC2 permission to pull ECR images & use SSM |
| Security Group | AppSecurityGroup | Allows SSH (22) + HTTP (8080) inbound |
| (optional) | CloudFront | (Planned) Global CDN distribution for frontend |

## 🛠️ Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + TypeScript + TailwindCSS |
| Backend | TypeScript + C++ + Python (+ Bash orchestration) |
| Infrastructure | AWS CDK v2 (TypeScript) |
| Containerization | Docker + ECR |
| Visualization | Matplotlib |
| OS tested | macOS Sequoia 15.x (cross-platform compatible) |

## 🚀 Deployment Instructions
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
