const fs = require('fs')
const AWS = require('aws-sdk')
const bytes = require('bytes')
const bluebird = require('bluebird')

const {streamToPromise} = require('@quirk0.o/cloud-functions-common')
const Benchmark = require('@quirk0.o/benchmark')
const {logP} = require('@quirk0.o/async')
const randomStream = require('@quirk0.o/random-stream')

const s3 = new AWS.S3()

const OUTPUT_BUCKET = process.env.OUTPUT_BUCKET_NAME
const INPUT_BUCKET = process.env.INPUT_BUCKET_NAME

const timestampedFileName = () => `transfer_${(new Date()).toISOString()}`
const file = (bucket, fileName, params) => Object.assign({Bucket: bucket, Key: fileName}, params)
const readFile = (bucket, fileName) => {
  const fileStream = s3.getObject(file(bucket, fileName)).createReadStream()
  const writer = fs.createWriteStream('/tmp/input.dat')

  streamToPromise(fileStream.pipe(writer))
}

const writeFile = (bucket, fileName, size) => {
  const chunkSize = 5 * 1024 * 1024

  const generator = randomStream(size, chunkSize)
  const params = {Body: generator}
  const options = {partSize: chunkSize, queueSize: 1}

  return bluebird.promisify(s3.upload)(file(bucket, fileName, params), options)
}
const response = (json) => ({statusCode: 200, body: JSON.stringify(json)})

const downloadPipeline = (inputFileName) => [
  logP(() => `Downloading s3://${INPUT_BUCKET}/${inputFileName}`),
  () => readFile(INPUT_BUCKET, inputFileName),
  logP(() => `Finished downloading`)
]

const uploadPipeline = (fileSize) => [
  timestampedFileName,
  logP((fileName) => `Uploading to s3://${OUTPUT_BUCKET}/${fileName}`),
  (fileName) => writeFile(OUTPUT_BUCKET, fileName, fileSize),
  logP(() => `Finished uploading`)
]

exports.download128 = (event, context, callback) => {
  const body = JSON.parse(event.body)
  if (!body.size) {
    callback(null, response({error: 'Missing file size in event data.'}))
  }

  const inputFileName = `${body.size}.dat`

  new Benchmark()
    .do('download')(
      ...downloadPipeline(inputFileName)
    )
    .json()
    .then(logP(json => `Finished: ${JSON.stringify(json)}`))
    .then(json => callback(null, response(json)))
}

exports.upload128 = (event, context, callback) => {
  const body = JSON.parse(event.body)
  if (!body.size) {
    callback(null, response({error: 'Missing file size in event data.'}))
  }

  const fileSize = bytes.parse(body.size)

  new Benchmark()
    .do('upload')(
      ...uploadPipeline(fileSize)
    )
    .json()
    .then(logP(json => `Finished: ${JSON.stringify(json)}`))
    .then(json => callback(null, response(json)))
}

exports.transfer = (event, context, callback) => {
  const body = JSON.parse(event.body)
  if (!body.size) {
    callback(null, response({error: 'Missing file size in event data.'}))
  }

  const fileSize = bytes.parse(body.size)
  const inputFileName = `${body.size}.dat`


  new Benchmark()
    .do('download')(
      ...downloadPipeline(inputFileName))
    .do('upload')(
      ...uploadPipeline(fileSize)
    )
    .json()
    .then(logP(json => `Finished: ${JSON.stringify(json)}`))
    .then(json => callback(null, response(json)))
}
