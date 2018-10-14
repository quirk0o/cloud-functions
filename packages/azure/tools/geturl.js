const path = require('path')
const yargs = require('yargs')
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
  .argv

process.env.NODE_ENV = argv.stage

const config = require('config')

const SCRIPT_PATH = path.resolve(__dirname, './geturl.sh')
const env = Object.assign({}, process.env, config.util.toObject())

execFile(SCRIPT_PATH, [], {env}, (err, stdout, stderr) => {
  if (err) throw new Error(stderr)
  const baseUrl = stdout.trim().replace(/"/g, '')
  console.log(`https://${baseUrl}/api/${argv.function}`)
})
