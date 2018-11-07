const inspectMemoryUsage = () => {
  const used = process.memoryUsage()
  for (let key in used) {
    console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`)
  }
}

// const TEMPORARY_FILE = '/tmp/input.dat'

// const inputFileName = (sizeStr) => `${sizeStr}.dat`
// const file = (bucket, fileName, options) => Object.assign({Bucket: bucket, Key: fileName}, options)

exports.handler = (params) => {
  console.log('invoked')
  inspectMemoryUsage()

  // require('dotenv').config()
  // console.log('configured')
  // inspectMemoryUsage()

  // const fs = require('fs')
  // console.log('libraries loaded')
  // inspectMemoryUsage()

  // const IBM = require('ibm-cos-sdk')
  // console.log('sdk included')
  // inspectMemoryUsage()

  // const Benchmark = require('@quirk0.o/benchmark')
  // const {logP, tapP} = require('@quirk0.o/async')
  // const {MissingParamError, streamToPromise} = require('@quirk0.o/cloud-functions-common')
  // console.log('utilities included')
  // inspectMemoryUsage()

  // const cosConfig = {
  //   endpoint: process.env.storageEndpoint,
  //   apiKeyId: process.env.apiKeyId,
  //   ibmAuthEndpoint: process.env.authEndpoint,
  //   serviceInstanceId: process.env.serviceInstanceId
  // }
  // const cos = new IBM.S3(cosConfig)
  // console.log('client instantiated')
  // inspectMemoryUsage()

  // const readFile = (bucket, fileName) => {
  //   const params = file(bucket, fileName)
  //   let chunks = 0
  //   let received = 0
  //   return cos.headObject(params)
  //     .promise()
  //     .then(() => {
  //       const fileStream = cos
  //         .getObject(params)
  //         .on('error', Promise.reject)
  //         .createReadStream()
  //         .on('data', (chunk) => {
  //           chunks += 1
  //           received += chunk.length
  //           console.log(`received ${chunks} chunks, ${received} bytes`)
  //           inspectMemoryUsage()
  //         })
  //       const writer = fs.createWriteStream(TEMPORARY_FILE)
  //
  //       return streamToPromise(fileStream.pipe(writer))
  //     })
  //     .catch((error) => {
  //       if (error.statusCode === 404) {
  //         return Promise.reject(`No such file: cos://${bucket}/${fileName}.`)
  //       }
  //       return Promise.reject(error)
  //     })
  // }
  //
  // const requireSize = (params) => {
  //   if (!params.size) {
  //     throw new MissingParamError('size')
  //   }
  //   return params.size
  // }
  //
  return {status: 200, message: 'Hello'}

  // try {
  //   const size = requireSize(params)
  //   const inputBucket = process.env.inputBucket
  //   console.log('before test')
  //   inspectMemoryUsage()
  //
  //   return new Benchmark()
  //     .do('download')(
  //       () => inputFileName(size),
  //       logP((fileName) => `Downloading cos://${inputBucket}/${fileName}`),
  //       (fileName) => readFile(inputBucket, fileName),
  //       logP(() => `Finished downloading`)
  //     )
  //     .json()
  //     .then(tapP(() => {
  //       inspectMemoryUsage()
  //     }))
  //     .then(logP(json => `Finished: ${JSON.stringify(json)}`))
  // } catch (e) {
  //   if (e instanceof MissingParamError) {
  //     return {status: 400, error: e.message}
  //   }
  //   return {status: 500, error: e.message}
  // }
}

