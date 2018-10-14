# Serverless Research

## Setting up your Azure credentials

The following environment variables must be set, with their respective values:

- *azureSubId* - ID of the Azure subscription you want to create your service within
- *azureServicePrincipalTenantId* - ID of the tenant that your service principal was created within
- *azureServicePrincipalClientId* - ID of the service principal you want to use to authenticate with Azure
- *azureServicePrincipalPassword* - Password of the service principal you want to use to autheticate with Azure

For details on how to create a service principal and/or acquire your Azure account's subscription/tenant ID, refer to the [Azure credentials](https://serverless.com/framework/docs/providers/azure/guide/credentials/) documentation.

## Deploying the service

Once your Azure credentials are set, you can immediately deploy your service via the following command:

```shell
serverless deploy
```

This will create the neccessary Azure resources to support the service and events that are defined in your `serverless.yml` file. 

## Invoking and inspecting a function

With the service deployed, you can test it's functions using the following command:

```shell
serverless invoke -f hello
```

```shell
curl -X POST \
  '[API_GATEWAY]' \
  -H 'cache-control: no-cache' \
  -H 'content-type: application/json' \
  -d '{"fileName": "[FILENAME]"}'
```


Additionally, if you'd like to view the logs that a function generates (either via the runtime, or create by your handler by calling `context.log`), you can simply run the following command:

```shell
serverless logs -f hello
```
