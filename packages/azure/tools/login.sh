#!/bin/bash

echo $AZURE_USERNAME
az login -u $AZURE_USERNAME -p $AZURE_PASSWORD
