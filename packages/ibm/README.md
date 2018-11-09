
## Setup

1. Run `yarn install`

## Setup the Cloud Foundry Org

2. Create a Cloud Foundry Org in IBM dashboard
3. Create a space (e.g. `dev`)
4. Create a resource group

## Setup Cloud Storage
5. Create a Cloud Storage service
6. Create Service Credentials for the Cloud Storage
6. Create a Storage Input Bucket (e.g. serverless-input-bucket)
6. Upload a file to the Storage Input Bucket
7. Create a Storage Output Bucket (e.g. serverless-output-bucket)

## Login to Bluemix
1. Download and install Bluemix CLI https://console.bluemix.net/docs/cli/reference/bluemix_cli/download_cli.html
2. Install Cloud Functions Plugin
```bash
bx plugin install Cloud-Functions -r Bluemix
```
3. Login to Bluemix
```bash
bx login -o [ORG] -s [SPACE] -g [RESOURCE_GROUP]
```
4. Test the connection
```bash
bx wsk action invoke /whisk.system/utils/echo -p message hello --result
```
5. Verify the file `~/.wskprops` exists

## Deploy

```bash
sls deploy
```

## Run
```bash
sls invoke transfer_[MEMORY]
```
or 
```bash
curl -X POST \
   [API_GATEWAY] \
   -H 'cache-control: no-cache' \
   -H 'content-type: application/json' \
   -d '{"fileName": "[FILENAME]"}'
```
