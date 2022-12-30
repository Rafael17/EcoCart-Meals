terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region  = "us-east-1"
}

data "aws_secretsmanager_secret" "meals_api_key" {
  name = "MEALS_API_KEY"
}

data "aws_secretsmanager_secret_version" "meals_api_key" {
  secret_id = "${data.aws_secretsmanager_secret.meals_api_key.id}"
}

# Archive lambda function
data "archive_file" "main" {
  type        = "zip"
  source_dir  = "function/build"
  output_path = "${path.module}/.terraform/archive_files/function.zip"
}

resource "aws_lambda_function" "meals_api" {
  filename      = "${path.module}/.terraform/archive_files/function.zip"
  function_name = "lambda-meals-api"
  role          = aws_iam_role.meals_api_role.arn
  handler       = "index.handler"
  runtime       = "nodejs16.x"
  timeout = 300

  environment {
    variables = {
      API_KEY = data.aws_secretsmanager_secret_version.meals_api_key.secret_string
    }
  }

  # upload the function if the code hash is changed
  source_code_hash = data.archive_file.main.output_base64sha256
}

resource "aws_iam_role" "meals_api_role" {
  name               = "meals_api_role"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
  inline_policy {
    name = "lamda-meals-api-policy"
    policy = jsonencode({
      "Version" : "2012-10-17",
      "Statement" : [
        {
          "Sid" : "LambdaMealsApi1",
          "Effect" : "Allow",
          "Action" : [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
          ],
          "Resource" : "*"
        }
      ]
    })
  }
}