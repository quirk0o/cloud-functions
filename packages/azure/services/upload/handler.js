const azure = require('azure-storage')
const path = require('path')
const bytes = require('bytes')
const randomStream = require('@quirk0.o/random-stream')
const Benchmark = require('@quirk0.o/benchmark')
const {logP} = require('@quirk0.o/async')

const outputFileName = () => `transfer`

const writeFile = (blobService) => (container, fileName, size) => {
  const chunkSize = size / 8
  const generator = randomStream(size, chunkSize)

  return new Promise((resolve, reject) =>
    blobService.createBlockBlobFromStream(
      container,
      fileName,
      generator,
      size,
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

const requireSize = (context) => (body) => {
  if (!body.size) {
    send(context)({error: 'Missing file size in event data.'})
  }
  return body.size
}

const requireEnv = (context) => (env) => {
  if (env.error) {
    send(context)({error: `Error loading env: '${env.error}'.`})
  }
  return process.env
}

module.exports.upload = (context, request) => {
  const body = JSON.parse(request.body)
  const functionDirectory = context.executionContext.functionDirectory

  const env = setEnv(functionDirectory)
  const size = requireSize(context)(body)
  const {connectionString, container} = requireEnv(context)(env)
  const sizeInBytes = bytes.parse(size)

  const blobService = azure.createBlobService(connectionString)

  new Benchmark()
    .do('upload')(
      outputFileName,
      logP((fileName) => `Uploading to azs://${container}/${fileName}`, context),
      (fileName) => writeFile(context, blobService)(container, fileName, sizeInBytes),
      logP(() => `Finished uploading`, context)
    )
    .json()
    .then(logP(json => `Finished: ${JSON.stringify(json)}`, context))
    .then(send(context))
}
