const fs = require('fs')
const bytes = require('bytes')
const stream = require('stream')
const runtimeConfig = require('cloud-functions-runtime-config')
const storage = require('@google-cloud/storage')()

const {streamToPromise} = require('@quirk0.o/cloud-functions-common')
const Benchmark = require('@quirk0.o/benchmark')
const {logP} = require('@quirk0.o/async')
const randomStream = require('@quirk0.o/random-stream')
const env = require('./environment')

const CONFIG_KEY = `serverless-research-config`
const INPUT_BUCKET_CONFIG_KEY = 'buckets/input'
const OUTPUT_BUCKET_CONFIG_KEY = 'buckets/output'

const config = (key) => () => runtimeConfig.getVariable(CONFIG_KEY, key)

const outputFileName = (memory, sizeStr) => `transfer_${memory}_${sizeStr}`
const inputFileName = (sizeStr) => `${sizeStr}.dat`
const outputFileSize = (sizeStr) => bytes.parse(sizeStr)

const file = (bucket, fileName) => storage.bucket(bucket).file(fileName)
const readFile = (bucket, fileName) => {
  const fileStream = file(bucket, fileName).createReadStream()
  const writer = fs.createWriteStream('/tmp/input.dat')
  return streamToPromise(fileStream.pipe(writer))
}

const writeFile = (bucket, fileName, size) => {
  const writeStream = file(bucket, fileName).createWriteStream()
  const chunkSize = size / 8
  const generator = randomStream(size, chunkSize)
  return streamToPromise(generator.pipe(writeStream))
}

const writeStr = (bucket, fileName, str) => {
  const writeStream = file(bucket, fileName).createWriteStream()
  let read = false
  const generator = new stream.Readable({
    read () {
      if (read) {
        return generator.push(null)
      }
      read = true
      return generator.push(str)
    }
  })
  return streamToPromise(generator.pipe(writeStream))
}

const validateReq = (body) => {
  if (!body.size) throw new Error('Missing file size in event data.')
  return body
}

exports.transfer = (memory) => (request, response) => {
  try {
    validateReq(request.body)
    const {size} = request.body

    new Benchmark()
      .do('download')(
        config(INPUT_BUCKET_CONFIG_KEY),
        (bucket) => [bucket, inputFileName(size)],
        logP(([bucket, fileName]) => `Downloading gs://${bucket}/${fileName}`),
        ([bucket, fileName]) => readFile(bucket, fileName),
        logP(() => `Finished downloading`)
      )
      .do('upload')(
        config(OUTPUT_BUCKET_CONFIG_KEY),
        (bucket) => [bucket, outputFileName(memory, size), outputFileSize(size)],
        logP(([bucket, fileName]) => `Uploading to gs://${bucket}/${fileName}`),
        ([bucket, fileName, fileSize]) => writeFile(bucket, fileName, fileSize),
        logP(() => `Finished uploading`)
      )
      .json()
      .then(logP(json => `Finished: ${JSON.stringify(json)}`))
      .then(json => response.status(200).json(json))
  } catch (e) {
    response.status(200).json({error: e.message})
  }
}

exports['transfer-128'] = exports.transfer('128')
exports['transfer-256'] = exports.transfer('256')
exports['transfer-512'] = exports.transfer('512')
exports['transfer-1024'] = exports.transfer('1024')
exports['transfer-2048'] = exports.transfer('2048')
exports['transfer-dev-128'] = exports.transfer('128')
exports['transfer-dev-256'] = exports.transfer('256')
exports['transfer-dev-512'] = exports.transfer('512')
exports['transfer-dev-1024'] = exports.transfer('1024')
exports['transfer-dev-2048'] = exports.transfer('2048')

exports.latency = (memory) => (request, response) => {
  try {
    new Benchmark()
      .do('latency')(
        config(OUTPUT_BUCKET_CONFIG_KEY),
        (bucket) => [bucket, 'empty.dat'],
        logP(([bucket, fileName]) => `Uploading to gs://${bucket}/${fileName}`),
        ([bucket, fileName]) => writeStr(bucket, fileName, '\0'),
        logP(() => `Finished uploading`)
      )
      .json()
      .then(logP(json => `Finished: ${JSON.stringify(json)}`))
      .then(json => response.status(200).json(json))
  } catch (e) {
    response.status(200).json({error: e.message})
  }
}

exports['latency-128'] = exports.latency('128')
exports['latency-256'] = exports.latency('256')
exports['latency-512'] = exports.latency('512')
exports['latency-1024'] = exports.latency('1024')
exports['latency-2048'] = exports.latency('2048')
exports['latency-dev-128'] = exports.latency('128')
exports['latency-dev-256'] = exports.latency('256')
exports['latency-dev-512'] = exports.latency('512')
exports['latency-dev-1024'] = exports.latency('1024')
exports['latency-dev-2048'] = exports.latency('2048')
