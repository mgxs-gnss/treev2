terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.27.0"
    }
  }
}

provider "aws" {
  region = "eu-west-2"
}

import {
  to = aws_s3_bucket.tree
  id = var.tree.bucket
}

import {
  to = aws_cloudfront_distribution.distribution
  id = var.tree.cloudfront
}
