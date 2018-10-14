#!/bin/bash

az login --service-principal -u $azureAppId --password $azureServicePrincipalPassword --tenant $azureServicePrincipalTenantId

