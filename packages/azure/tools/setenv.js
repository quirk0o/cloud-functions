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
  .argv

process.env.NODE_ENV = argv.stage

const config = require('config')
console.log('Setting environment with config:', config)

const SCRIPT_PATH = path.resolve(__dirname, './setenv.sh')
const env = Object.assign({}, process.env, config.util.toObject())

execFile(SCRIPT_PATH, [], {env}, (err, stdout, stderr) => {
  if (err) throw new Error(stderr)
  console.log(stdout)
})
