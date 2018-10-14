const azure = require('azure-storage')
const path = require('path')
const fs = require('fs')
const Benchmark = require('@quirk0.o/benchmark')
const {logP} = require('@quirk0.o/async')

const inputFileName = (sizeStr) => `${sizeStr}.dat`

const readFile = (blobService) => (functionDirectory, container, fileName) => {
  const writer = fs.createWriteStream(path.resolve(functionDirectory, 'input.dat'))
  return new Promise((resolve, reject) =>
    blobService.getBlobToStream(
      container,
      fileName,
      writer,
      (error) => error ? reject(error) : resolve()
    )
  )
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

module.exports.download = (context, request) => {
  const body = JSON.parse(request.body)
  const functionDirectory = context.executionContext.functionDirectory

  const env = setEnv(functionDirectory)
  const size = requireSize(context)(body)
  const {connectionString, inputContainer} = requireEnv(context)(env)

  const blobService = azure.createBlobService(connectionString)

  new Benchmark()
    .do('download')(
      () => inputFileName(size),
      logP((fileName) => `Downloading azs://${inputContainer}/${fileName}`, context),
      (fileName) => readFile(blobService)(functionDirectory, inputContainer, fileName),
      logP(() => `Finished downloading`, context)
    )
    .json()
    .then(logP(json => `Finished: ${JSON.stringify(json)}`, context))
    .then(send(context))
}
