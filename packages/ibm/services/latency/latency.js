require('dotenv').config()

const bluebird = require('bluebird')
const IBM = require('ibm-cos-sdk')

const Benchmark = require('@quirk0.o/benchmark')
const {logP} = require('@quirk0.o/async')

const cosConfig = {
  endpoint: process.env.storageEndpoint,
  apiKeyId: process.env.apiKeyId,
  ibmAuthEndpoint: process.env.authEndpoint,
  serviceInstanceId: process.env.serviceInstanceId
}
const cos = new IBM.S3(cosConfig)
const putObject = bluebird.promisify(cos.putObject).bind(cos)

const OUTPUT_BUCKET = process.env.bucket

const fileName = () => `empty.dat`
const file = (bucket, fileName, options) => Object.assign({Bucket: bucket, Key: fileName}, options)

const writeFile = (bucket, fileName, str) => {
  return putObject(file(bucket, fileName, {
    Body: str
  }))
}

exports.handler = () => {
  try {
    return new Benchmark()
      .do('latency')(
        fileName,
        logP((fileName) => `Uploading to cos://${OUTPUT_BUCKET}/${fileName}`),
        (fileName) => writeFile(OUTPUT_BUCKET, fileName, '\0'),
        logP(() => `Finished uploading`)
      )
      .json()
      .then(logP(json => `Finished: ${JSON.stringify(json)}`))
  } catch (e) {
    return {status: 500, error: e.message}
  }
}

