#!/bin/bash

az functionapp config appsettings set \
    --resource-group ${resourceGroup} \
    --name ${service} \
    --settings \
        AZURE_STORAGE_CONNECTION_STRING="${connectionString}" \
        AZURE_STORAGE_CONTAINER=${container} \
        AZURE_STORAGE_INPUT_CONTAINER=${inputContainer}
