const Promise = require('bluebird')
const azure = Promise.promisifyAll(require('azure-storage'))
const path = require('path')
const fs = require('fs')
const bytes = require('bytes')

const Benchmark = require('@quirk0.o/benchmark')
const {logP} = require('@quirk0.o/async')
const randomStream = require('@quirk0.o/random-stream')

const inputFileName = (sizeStr) => `${sizeStr}.dat`
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
  return body.size
}

const requireEnv = (context) => (env) => {
  if (env.error) {
    send(context)({error: `Error loading env: '${env.error}'.`})
  }
  return process.env
}


module.exports.transfer = (context, request) => {
  const {body} = request
  const functionDirectory = context.executionContext.functionDirectory

  const env = setEnv(functionDirectory)
  const size = requireSize(context)(body)
  const {connectionString, inputContainer, container} = requireEnv(context)(env)

  const blobService = azure.createBlobService(connectionString)

  const sizeInBytes = bytes.parse(size)

  new Benchmark()
    .do('download')(
      () => inputFileName(size),
      logP((fileName) => `Downloading azs://${inputContainer}/${fileName}`, context),
      (fileName) => readFile(blobService)(functionDirectory, inputContainer, fileName),
      logP(() => `Finished downloading`, context)
    )
    .do('upload')(
      outputFileName,
      logP((fileName) => `Uploading to azs://${container}/${fileName}`, context),
      (fileName) => writeFile(blobService)(container, fileName, sizeInBytes),
      logP(() => `Finished uploading`, context)
    )
    .json()
    .then(logP(json => `Finished: ${JSON.stringify(json)}`, context))
    .then(send(context))
}
