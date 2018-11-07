require('dotenv').config()

const fs = require('fs')
const IBM = require('ibm-cos-sdk')

const {streamToPromise, MissingParamError} = require('@quirk0.o/cloud-functions-common')
const Benchmark = require('@quirk0.o/benchmark')
const {logP} = require('@quirk0.o/async')

const cosConfig = {
  endpoint: process.env.storageEndpoint,
  apiKeyId: process.env.apiKeyId,
  ibmAuthEndpoint: process.env.authEndpoint,
  serviceInstanceId: process.env.serviceInstanceId
}
const cos = new IBM.S3(cosConfig)

const INPUT_BUCKET = process.env.inputBucket
const TEMPORARY_FILE = '/tmp/input.dat'

const inputFileName = (sizeStr) => `${sizeStr}.dat`

const file = (bucket, fileName, options) => Object.assign({Bucket: bucket, Key: fileName}, options)
const readFile = (bucket, fileName) => {
  const params = file(bucket, fileName)
  return cos.headObject(params)
    .promise()
    .then(() => {
      const fileStream = cos
        .getObject(params)
        .on('error', Promise.reject)
        .createReadStream()
      const writer = fs.createWriteStream(TEMPORARY_FILE)

      return streamToPromise(fileStream.pipe(writer))
    })
    .catch((error) => {
      if (error.statusCode === 404) {
        return Promise.reject(`No such file: cos://${bucket}/${fileName}.`)
      }
      return Promise.reject(error)
    })
}

const requireSize = (params) => {
  if (!params.size) {
    throw new MissingParamError('size')
  }
  return params.size
}

exports.handler = (params) => {
  try {
    const size = requireSize(params)

    return new Benchmark()
      .do('download')(
        () => inputFileName(size),
        logP((fileName) => `Downloading cos://${INPUT_BUCKET}/${fileName}`),
        (fileName) => readFile(INPUT_BUCKET, fileName),
        logP(() => `Finished downloading`)
      )
      .json()
      .then(logP((json) => `Finished: ${JSON.stringify(json)}`))
  }
  catch (e) {
    if (e instanceof MissingParamError) {
      return {status: 400, error: e.message}
    }
    return {status: 500, error: e.message}
  }
}

