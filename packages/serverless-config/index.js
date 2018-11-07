require('colors')

function printConfig(config) {
  console.log(Object.entries(config.util.toObject())
    .map(([key, value]) => `${key.yellow}\n\t${value}`)
    .join('\n')
  )
}

module.exports = (sls) => {
  const stage = sls.variables.options.stage || sls.service.provider.stage
  process.env.NODE_ENV = stage

  console.log(`Using stage: ${stage.yellow}\n`)

  const config = require('config')

  console.log('Serverless config:\n'.yellow)
  printConfig(config)
  console.log('\n')

  return Object.assign({}, config, {stage})
}

