const azure = require('azure-storage')
const path = require('path')
const Benchmark = require('@quirk0.o/benchmark')
const {logP} = require('@quirk0.o/async')

const writeFile = (blobService) => (container, fileName, str) => {
  return new Promise((resolve, reject) =>
    blobService.createBlockBlobFromText(
      container,
      fileName,
      str,
      {blockIdPrefix: 'block'},
      (error) => error ? reject(error) : resolve()
    ))
}

const response = (json) => ({status: 200, body: json})
const send = (context) => (json) => {
  context.res = response(json)
  context.done()
}

const setEnv = (functionDirectory) => require('dotenv')
  .config({path: path.resolve(functionDirectory, '.env')})

const requireEnv = (context) => (env) => {
  if (env.error) {
    send(context)({error: `Error loading env: '${env.error}'.`})
  }
  return process.env
}

module.exports.latency = (context) => {
  const functionDirectory = context.executionContext.functionDirectory

  const env = setEnv(functionDirectory)
  const {connectionString, container} = requireEnv(context)(env)

  const blobService = azure.createBlobService(connectionString)

  new Benchmark()
    .do('latency')(
      () => 'empty.dat',
      logP((fileName) => `Uploading to azs://${container}/${fileName}`, context),
      (fileName) => writeFile(blobService)(container, fileName, '\0'),
      logP(() => `Finished uploading`, context)
    )
    .json()
    .then(logP(json => `Finished: ${JSON.stringify(json)}`, context))
    .then(send(context))
}
