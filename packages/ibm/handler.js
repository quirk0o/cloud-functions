const fs = require('fs')
const stream = require('stream')
const bluebird = require('bluebird')
const IBM = require('ibm-cos-sdk')

const {streamToPromise} = require('@quirk0.o/cloud-functions-common')
const Benchmark = require('@quirk0.o/benchmark')
const {logP} = require('@quirk0.o/async')

const cos = new IBM.S3(cosConfig)
const putObjectStream = bluebird.promisify(cos.upload).bind(cos)

const OUTPUT_BUCKET = 'serverless-research-output-bucket'
const INPUT_BUCKET = 'serverless-research-input-bucket'

const timestampedFileName = () => `transfer_${(new Date()).toISOString()}`
const file = (bucket, fileName, options) => Object.assign({Bucket: bucket, Key: fileName}, options)
const readFile = (bucket, fileName) => {
  try {
    const fileStream = cos.getObject(file(bucket, fileName)).createReadStream()
    const writer = fs.createWriteStream('/tmp/input.dat')

    return streamToPromise(fileStream.pipe(writer))
  } catch (e) {
    return Promise.reject(e)
  }
}

const writeFile = (bucket, fileName) => {
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

  return putObjectStream(file(bucket, fileName, {
    Body: generator
  }))
}

exports.transfer = (params) => {
  const inputFileName = params.fileName

  return new Benchmark()
    .do('download')(
      logP(() => `Downloading cos://${INPUT_BUCKET}/${inputFileName}`),
      () => readFile(INPUT_BUCKET, inputFileName),
      logP(() => `Finished downloading`)
    )
    .do('upload')(
      timestampedFileName,
      logP((fileName) => `Uploading to cos://${OUTPUT_BUCKET}/${fileName}`),
      (fileName) => writeFile(OUTPUT_BUCKET, fileName),
      logP(() => `Finished uploading`)
    )
    .json()
    .then(logP(json => `Finished: ${JSON.stringify(json)}`))
}

