#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

DIR="${BASH_SOURCE%/*}"
if [[ ! -d "$DIR" ]]; then DIR="$PWD"; fi

. "$DIR/yaml.sh"

if [ $# -eq 0 ]
  then
    echo "usage: $0 path [-s stage]"
    exit
fi

source_folder=$1

shift
while getopts ":s:" opt; do
  case ${opt} in
    s )
      stage=$OPTARG
      ;;
    \? )
      echo "Invalid option: $OPTARG" 1>&2
      exit
      ;;
    : )
      echo "Invalid option: $OPTARG requires an argument" 1>&2
      exit
      ;;
  esac
done

stage=${stage:-dev}

create_variables "$DIR/../environment/$stage.yml"

bucket_name=$inputBucket

if aws s3 ls "s3://$bucket_name" 2>&1 | grep -q 'NoSuchBucket'
then
   echo "Creating bucket $bucket_name"
   aws s3 mb "s3://$bucket_name" --region eu-west-1
   if [ $? -eq 1 ]
   then
     echo -e "${RED}Failed to create bucket $bucket_name${NC}" >&2
     exit 1
   fi
fi

echo "Uploading to bucket: $bucket_name"

for f in $source_folder
do
  echo "Uploading $f file..."
  aws s3 cp $f "s3://$bucket_name"
  if [ $? -eq 1 ]
  then
    echo -e "${RED}Failed to upload file $f${NC}" >&2
    exit 1
  fi
done

echo "List all files in bucket..."
aws s3 ls "s3://$bucket_name"

echo -e "${GREEN}Completed${NC}"
