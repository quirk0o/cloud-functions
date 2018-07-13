const Promise = require('bluebird')
const azure = Promise.promisifyAll(require('azure-storage'))
const path = require('path')
const fs = require('fs')
const bytes = require('bytes')

const Benchmark = require('@quirk0.o/benchmark')
const {logP} = require('@quirk0.o/async')
const randomStream = require('@quirk0.o/random-stream')

const outputFileName = () => `transfer`

const readFile = (blobService) => (functionDirectory, container, fileName) => {
  const writer = fs.createWriteStream(path.resolve(functionDirectory, 'input.dat'))
  return blobService.getBlobToStreamAsync(container, fileName, writer)
}

const writeFile = (blobService) => (container, fileName, size) => {
  const chunkSize = size / 8
  const generator = randomStream(size, chunkSize)

  return blobService.createBlockBlobFromStreamAsync(
    container,
    fileName,
    generator,
    size,
    {blockIdPrefix: 'block'}
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
}

const requireEnv = (context) => (env) => {
  if (env.error) {
    send(context)({error: `Error loading env: '${env.error}'.`})
  }
}

module.exports.transfer = (context, request) => {
  const {body} = request
  const functionDirectory = context.executionContext.functionDirectory
  const env = setEnv(functionDirectory)

  requireSize(context)(body)
  requireEnv(context)(env)

  const {connectionString, inputContainer, container} = process.env
  const blobService = azure.createBlobService(connectionString)

  const size = body.size
  const sizeInBytes = bytes.parse(body.size)
  const inputFileName = `${size}.dat`

  new Benchmark()
    .do('download')(
      logP(() => `Downloading azs://${inputContainer}/${inputFileName}`, context),
      () => readFile(blobService)(functionDirectory, inputContainer, inputFileName),
      logP(() => `Finished downloading`, context)
    )
    .do('upload')(
      timestampedFileName,
      logP((fileName) => `Uploading to azs://${container}/${fileName}`, context),
      (fileName) => writeFile(blobService)(container, fileName, sizeInBytes),
      logP(() => `Finished uploading`, context)
    )
    .json()
    .then(logP(json => `Finished: ${JSON.stringify(json)}`, context))
    .then(send(context))
}
