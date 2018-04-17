const runtimeConfig = require('cloud-functions-runtime-config')
const storage = require('@google-cloud/storage')()
const fs = require('fs')
const stream = require('stream')
const ResponseBuilder = require('cloud-functions-common').ResponseBuilder
const streamToPromise = require('cloud-functions-common').streamToPromise

const CONFIG_KEY = `serverless-research-config`
const INPUT_BUCKET_CONFIG_KEY = 'buckets/input'
const OUTPUT_BUCKET_CONFIG_KEY = 'buckets/output'

const config = (key) => () => runtimeConfig.getVariable(CONFIG_KEY, key)

const tapP = (fn) => (value) => {
  fn(value)
  return value
}
const logP = (fn) => tapP((value) => console.log(fn(value)))
const pipeP = (...fns) => fns.reduce((prev, curr) => prev.then(curr), Promise.resolve())

const catchP = (fn) => (promise) => promise.catch(fn)

const pipe = (initial, ...fns) => fns.reduce((prev, curr) => curr(prev), initial)

const timestampedFileName = () => `random_${(new Date()).toISOString()}`
const file = (bucket, fileName) => storage.bucket(bucket).file(fileName)
const readFile = (bucket, fileName) => {
  const fileStream = file(bucket, fileName).createReadStream()
  const writer = fs.createWriteStream('/tmp/input.dat')

  return streamToPromise(fileStream.pipe(writer))
}

const writeFile = (bucket, fileName) => {
  const writeStream = file(bucket, fileName).createWriteStream()
  const generator = new stream.Readable()
  const size = 64 * 1024
  const chunkSize = 16384
  let i = 1;

  generator._read = () => {
    if (i > size) {
      return generator.push(null)
    }
    generator.push('\0'.repeat(chunkSize))
    i += chunkSize
  }

  generator.pipe(writeStream)
}

exports.transfer = (request, response) => {
  const responseBuilder = new ResponseBuilder()
  const size = request.body.size
  const inputFileName = `${size}`

  pipeP(
    config(INPUT_BUCKET_CONFIG_KEY),
    (bucket) => readFile(bucket, inputFileName),
    () => responseBuilder._registerResponse(undefined, 'download'),
    logP(() => `Finished reading: ${responseBuilder._time.download}`),
    config(OUTPUT_BUCKET_CONFIG_KEY),
    (bucket) => writeFile(bucket, timestampedFileName()),
    () => responseBuilder._registerResponse(undefined, 'upload'),
    logP(() => `Finished writing: ${responseBuilder._time.upload}`),
    () => responseBuilder.toJSON(),
    tapP((json) => response.status(200).json(json)),
    logP((json) => `Finished: ${JSON.stringify(json)}`)
  )
    .catch(logP((err) => `Error while reading: ${err}`))
}

exports.transfer_128 = exports.transfer
exports.transfer_256 = exports.transfer
exports.transfer_512 = exports.transfer
exports.transfer_1024 = exports.transfer
exports.transfer_2048 = exports.transfer
