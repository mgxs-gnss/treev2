variable "tree" {
  type = object({
    bucket     = string
    cloudfront = string
  })
  default = {
    bucket     = "tree.mgxs.co"
    cloudfront = "E26E60IPYVFYTG"
  }
}

variable "config" {
  type = object({
    region   = string
    cert_arm = string
  })
  default = {
    region   = "eu-west-2"
    cert_arm = "arn:aws:acm:us-east-1:718497110589:certificate/b9b0fbe1-e526-4d37-8cef-23b1ad6d71cb"
  }
}

