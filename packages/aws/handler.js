const fs = require('fs')
const AWS = require('aws-sdk')
const bytes = require('bytes')
const bluebird = require('bluebird')
const stream = require('stream')

const {streamToPromise} = require('@quirk0.o/cloud-functions-common')
const Benchmark = require('@quirk0.o/benchmark')
const {logP} = require('@quirk0.o/async')
const randomStream = require('@quirk0.o/random-stream')

const OUTPUT_BUCKET = process.env.OUTPUT_BUCKET_NAME
const INPUT_BUCKET = process.env.INPUT_BUCKET_NAME

const outputFileName = (context, sizeStr) => `transfer_${context.memoryLimitInMB}_${sizeStr}`
const inputFileName = (sizeStr) => `${sizeStr}.dat`
const outputFileSize = (sizeStr) => bytes.parse(sizeStr)

const file = (bucket, fileName, params) => Object.assign({Bucket: bucket, Key: fileName}, params)
const readFile = (service) => (bucket, fileName) => {
  const fileStream = service.getObject(file(bucket, fileName)).createReadStream()
  const writer = fs.createWriteStream('/tmp/input.dat')

  streamToPromise(fileStream.pipe(writer))
}

const writeFile = (service) => (bucket, fileName, size) => {
  const maxChunkSize = 5 * 1024 * 1024
  const generator = randomStream(size, maxChunkSize)
  const params = {Body: generator}
  const options = {partSize: maxChunkSize, queueSize: 1}

  return bluebird.promisify(service.upload.bind(service))(file(bucket, fileName, params), options)
}
const response = (json) => ({statusCode: 200, body: JSON.stringify(json)})

const parseReq = (event) => JSON.parse(event.body)
const validateReq = (body) => {
  if (!body.size) throw new Error('Missing file size in event data.')
  return body
}

const runTasks = (...taskList) => (event, context, callback) => {
  try {
    const s3 = new AWS.S3({signatureVersion: 'v4'})
    const {size} = validateReq(parseReq(event))

    const benchmark = new Benchmark()

    if (taskList.includes('download')) {
      benchmark
        .do('download')(
          () => inputFileName(size),
          logP((fileName) => `Downloading s3://${INPUT_BUCKET}/${fileName}`),
          (fileName) => readFile(s3)(INPUT_BUCKET, fileName),
          logP(() => `Finished downloading`)
        )
    }

    if (taskList.includes('upload')) {
      benchmark
        .do('upload')(
          () => outputFileName(context, size),
          (fileName) => [fileName, outputFileSize(size)],
          logP(([fileName]) => `Uploading to s3://${OUTPUT_BUCKET}/${fileName}`),
          ([fileName, fileSize]) => writeFile(s3)(OUTPUT_BUCKET, fileName, fileSize),
          logP(() => `Finished uploading`)
        )
    }

    return benchmark
      .json()
      .then(logP(json => `Finished: ${JSON.stringify(json)}`))
      .then(json => callback(null, response(json)))


  } catch (e) {
    callback(null, response({error: e.message}))
  }
}

exports.download128 = runTasks('download')
exports.upload128 = runTasks('upload')
exports.transfer = runTasks('download', 'upload')
