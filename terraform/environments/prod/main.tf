terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.24"
    }
  }

  # Remote state in S3 + DynamoDB locking
  backend "s3" {
    bucket         = "taskflow-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "taskflow-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "TaskFlow Pro"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# ─── VPC Module ───────────────────────────────────────────────────────────────
module "vpc" {
  source = "../../modules/vpc"

  name            = "taskflow-${var.environment}"
  cidr            = var.vpc_cidr
  azs             = var.availability_zones
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs
  environment     = var.environment
}

# ─── EKS Module ───────────────────────────────────────────────────────────────
module "eks" {
  source = "../../modules/eks"

  cluster_name    = "taskflow-${var.environment}"
  cluster_version = "1.28"
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnet_ids
  environment     = var.environment

  node_groups = {
    app = {
      instance_types = [var.node_instance_type]
      min_size       = var.min_nodes
      max_size       = var.max_nodes
      desired_size   = var.desired_nodes
      disk_size      = 50
    }
    monitoring = {
      instance_types = ["t3.medium"]
      min_size       = 1
      max_size       = 2
      desired_size   = 1
      disk_size      = 50
    }
  }

  depends_on = [module.vpc]
}

# ─── RDS Module ───────────────────────────────────────────────────────────────
module "rds" {
  source = "../../modules/rds"

  identifier     = "taskflow-${var.environment}"
  engine_version = "16.1"
  instance_class = var.db_instance_class
  db_name        = "taskflow_${var.environment}"
  username       = "taskflow"

  vpc_id              = module.vpc.vpc_id
  subnet_ids          = module.vpc.private_subnet_ids
  allowed_cidr_blocks = module.vpc.private_subnet_cidrs

  multi_az            = var.environment == "prod"
  storage_encrypted   = true
  deletion_protection = var.environment == "prod"
  skip_final_snapshot = var.environment != "prod"

  backup_retention_period = 30
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  environment = var.environment
  depends_on  = [module.vpc]
}

# ─── ECR Repositories ─────────────────────────────────────────────────────────
resource "aws_ecr_repository" "backend" {
  name                 = "taskflow-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }
}

resource "aws_ecr_repository" "frontend" {
  name                 = "taskflow-frontend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# ─── ECR Lifecycle Policies ───────────────────────────────────────────────────
resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 20 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 20
      }
      action = { type = "expire" }
    }]
  })
}
