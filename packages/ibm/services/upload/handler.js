require('dotenv').config()

const bluebird = require('bluebird')
const IBM = require('ibm-cos-sdk')
const bytes = require('bytes')

const Benchmark = require('@quirk0.o/benchmark')
const {logP} = require('@quirk0.o/async')
const randomStream = require('@quirk0.o/random-stream')
const {MissingParamError} = require('@quirk0.o/cloud-functions-common')

const cosConfig = {
  endpoint: process.env.storageEndpoint,
  apiKeyId: process.env.apiKeyId,
  ibmAuthEndpoint: process.env.authEndpoint,
  serviceInstanceId: process.env.serviceInstanceId
}
const cos = new IBM.S3(cosConfig)
const putObjectStream = bluebird.promisify(cos.upload).bind(cos)

const OUTPUT_BUCKET = process.env.bucket

const fileName = () => `transfer`
const file = (bucket, fileName, options) => Object.assign({Bucket: bucket, Key: fileName}, options)

const writeFile = (bucket, fileName, size) => {
  const chunkSize = size / 8
  const generator = randomStream(size, chunkSize)

  return putObjectStream(file(bucket, fileName, {
    Body: generator
  }))
}

const requireSize = (params) => {
  if (!params.size) {
    throw new MissingParamError('size')
  }
  return params.size
}

exports.upload = (params) => {
  try {
    const size = requireSize(params)
    const sizeInBytes = bytes.parse(size)

    return new Benchmark()
      .do('upload')(
        fileName,
        logP((fileName) => `Uploading to cos://${OUTPUT_BUCKET}/${fileName}`),
        (fileName) => writeFile(OUTPUT_BUCKET, fileName, sizeInBytes),
        logP(() => `Finished uploading`)
      )
      .json()
      .then(logP(json => `Finished: ${JSON.stringify(json)}`))
  } catch (e) {
    // if (e instanceof MissingParamError) {
    //   return {status: 400, error: e.message}
    // }
    return {status: 500, error: e.message}
  }
}

