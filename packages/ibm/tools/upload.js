const path = require('path')
const yargs = require('yargs')
const {execFile} = require('child_process')

const argv = yargs
  .command('* <path>', '', (yargs) => {
    yargs.positional('path', {
      describe: 'file(s) to upload',
      type: 'string'
    })
  })
  .option('s', {
    alias: 'stage',
    default: 'dev',
    describe: 'Serverless stage',
    type: 'string'
  })
  .argv

process.env.NODE_ENV = argv.stage

const config = require('config')

const SCRIPT_PATH = path.resolve(__dirname, './upload.sh')
const env = Object.assign({path: argv.path}, process.env, config.util.toObject())

execFile(SCRIPT_PATH, [], {env}, (err, stdout, stderr) => {
  if (err) throw new Error(stderr)
  console.log(stdout)
})
