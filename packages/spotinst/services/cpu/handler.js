const tload = process.hrtime()

const path = require('path')
const execSync = require('child_process').execSync

const Benchmark = require('@quirk0.o/benchmark')
const {logP} = require('@quirk0.o/async')
const {execToPromise} = require('@quirk0.o/cloud-functions-common')

const response = (json) => ({
  statusCode: 200,
  body: JSON.stringify(json),
  headers: {'Content-Type': 'application/json'}
})

module.exports.exec = (event, context, callback) => {
  const provider = process.env['SPOTINST_PROVIDER']
  const location = process.env['SPOTINST_LOCATION']

  const macAddr = execSync('/sbin/ip link | grep "link-netnsid 0" | cut -f 6 -d " " | tr -d "[:space:]"').toString()
  const cpuModel = execSync('grep "model name" /proc/cpuinfo | head -n 1 | cut -f 2 -d : | xargs').toString()

  const binaryDir = path.resolve(__dirname, 'bin')

  process.env.PATH += `:${binaryDir}`

  return new Benchmark()
    .do('exec')(
      logP(() => `Executing random number generation`),
      () => execToPromise(`chmod 755 ${binaryDir}/hello`),
      () => execToPromise('hello'),
      logP(({stdout}) => `Finished execution with ${stdout}`)
    )
    .json()
    .then(json => ({
      macAddr,
      cpuModel,
      location: location,
      provider: provider,
      time: json.time.exec,
      time_since_loaded: process.hrtime(tload)
    }))
    .then(logP(json => `Finished: ${JSON.stringify(json)}`))
    .then(json => callback(null, response(json)))
}
