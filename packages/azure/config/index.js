module.exports = (sls) => {
  const stage = sls.variables.options.stage || sls.service.provider.stage
  process.env.NODE_ENV = stage
  const config = require('config')
  return Object.assign({}, config, {stage})
}

