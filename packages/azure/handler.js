const Promise = require('bluebird')
const azure = Promise.promisifyAll(require('azure-storage'))
const path = require('path')
const fs = require('fs')
const stream = require('stream')
const Benchmark = require('@quirk0.o/benchmark')
const {logP} = require('@quirk0.o/async')

const STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING
const OUTPUT_CONTAINER = process.env.AZURE_STORAGE_CONTAINER
const INPUT_CONTAINER = process.env.AZURE_STORAGE_INPUT_CONTAINER

const blobService = azure.createBlobService(STORAGE_CONNECTION_STRING)

const timestampedFileName = () => `transfer_${(new Date()).toISOString()}`
const readFile = (functionDirectory, container, fileName) => {
  const writer = fs.createWriteStream(path.resolve(functionDirectory, 'input.dat'))
  return blobService.getBlobToStreamAsync(container, fileName, writer)
}

const writeFile = (container, fileName) => {
  const generator = new stream.Readable()
  const size = 64 * 1024
  const chunkSize = 16384
  let i = 1

  generator._read = () => {
    if (i > size) {
      return generator.push(null)
    }
    generator.push('\0'.repeat(chunkSize))
    i += chunkSize
  }

  return blobService.createBlockBlobFromStreamAsync(
    container,
    fileName,
    generator,
    size,
    {blockIdPrefix: 'block'}
  )
}

module.exports.transfer = (context, request) => {
  context.log('hello')
  const size = request.body.size
  const inputFileName = request.body.fileName
  const functionDirectory = context.executionContext.functionDirectory

  new Benchmark()
    .do('download')(
      logP(() => `Downloading azs://${INPUT_CONTAINER}/${inputFileName}`, context),
      () => readFile(functionDirectory, INPUT_CONTAINER, inputFileName),
      logP(() => `Finished downloading`, context)
    )
    .do('upload')(
      timestampedFileName,
      logP((fileName) => `Uploading to azs://${OUTPUT_CONTAINER}/${fileName}`, context),
      (fileName) => writeFile(OUTPUT_CONTAINER, fileName),
      logP(() => `Finished uploading`, context)
    )
    .json()
    .then(logP(json => `Finished: ${JSON.stringify(json)}`, context))
    .then(json => {
      context.log(json)
      context.res = json
      context.done()
    })
}
