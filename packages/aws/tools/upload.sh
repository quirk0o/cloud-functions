#!/bin/bash

DIR="${BASH_SOURCE%/*}"
if [[ ! -d "$DIR" ]]; then DIR="$PWD"; fi

. "$DIR/yaml.sh"

if [ $# -eq 0 ]
  then
    echo "usage: $0 path [-s stage]"
fi

shift
while getopts ":s:" opt; do
  case ${opt} in
    s )
      stage=$OPTARG
      ;;
    \? )
      echo "Invalid option: $OPTARG" 1>&2
      ;;
    : )
      echo "Invalid option: $OPTARG requires an argument" 1>&2
      ;;
  esac
done

stage=${stage:-dev}

create_variables "$DIR/../environment/$stage.yml"

bucket_name=$inputBucket
source_folder=$1

if aws s3 ls "s3://$bucket_name" 2>&1 | grep -q 'NoSuchBucket'
then
   echo "Creating bucket $bucket_name"
   aws s3 mb "s3://$bucket_name"
fi

echo "Uploading to bucket: $bucket_name"

for f in $source_folder
do
  echo "Uploading $f file..."
  aws s3 cp $f "s3://$bucket_name"
done

echo "List all files in bucket..."
aws s3 ls "s3://$bucket_name"

echo "Completed"
