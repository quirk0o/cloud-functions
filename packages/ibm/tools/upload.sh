#!/usr/bin/env bash

AWS_ACCESS_KEY_ID=d8f3ab7886f74204b4963664db887e5a AWS_SECRET_ACCESS_KEY=ce57122b625aa945e7d49d8978a869f055f67d30299b9596 aws --endpoint-url=http://$IBM_STORAGE_ENDPOINT s3 cp ../../sample_files/32MB.dat s3://serverless-research-dev-input-bucket
