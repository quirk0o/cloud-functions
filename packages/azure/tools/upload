#!/bin/bash

containerExists=$(az storage container exists --name ${inputContainer} --connection-string ${connectionString})

if [[ $containerExists = *"\"exists\": false"* ]]; then
  echo "Creating container ${inputContainer}"
  az storage container create \
    --name ${inputContainer} \
    --connection-string ${connectionString}
fi

for f in ${path}
do
  echo "Uploading ${f}"
  az storage blob upload \
    --file ${f} \
    --container-name ${inputContainer} \
    --name $(basename $f) \
    --connection-string ${connectionString}
done
 
echo "List all blobs in ${inputContainer}"
az storage blob list \
    --container-name ${inputContainer} \
    --connection-string ${connectionString}
 
echo "Completed"
