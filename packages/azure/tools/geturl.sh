#!/bin/bash

az functionapp show \
    --resource-group ${resourceGroup} \
    --name ${service} \
    --query defaultHostName
