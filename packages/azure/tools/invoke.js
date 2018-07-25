const path = require('path')
const yargs = require('yargs')
const colors = require('colors')
const {execFile} = require('child_process')

const argv = yargs
  .option('s', {
    alias: 'stage',
    default: 'dev',
    describe: 'Serverless stage',
    type: 'string'
  })
  .option('f', {
    alias: 'function',
    default: 'transfer',
    describe: 'Function name',
    type: 'string'
  })
  .option('d', {
    alias: 'data',
    default: '1MB',
    describe: 'File size',
    type: 'string'
  })
  .argv

process.env.NODE_ENV = argv.stage

const config = require('config')
const configObject = config.util.toObject()

const GETURL_SCRIPT_PATH = path.resolve(__dirname, './geturl.sh')
const INVOKE_SCRIPT_PATH = path.resolve(__dirname, './invoke.sh')

const functionName = argv.function
const size = argv.data
const service = `${configObject.service}-${functionName}`
const resourceGroup = `${service}-rg`
const env = Object.assign({}, process.env, configObject, {service, resourceGroup})

execFile(GETURL_SCRIPT_PATH, [], {env: env}, (err, stdout, stderr) => {
  if (err) throw new Error(stderr)
  const baseUrl = stdout.trim().replace(/"/g, '')
  const url = `https://${baseUrl}/api/${functionName}`
  console.log(`Invoking function ${functionName} at ${url}.`.yellow)

  const invokeEnv = Object.assign({}, env, {url, size})

  execFile(INVOKE_SCRIPT_PATH, [], {env: invokeEnv}, (err, stdout, stderr) => {
    if (err) throw new Error(stderr)
    console.log(stdout)
  })
})

