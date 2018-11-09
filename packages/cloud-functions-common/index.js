const streamToPromise = require('./stream-to-promise')
const execToPromise = require('./exec-to-promise')
const ResponseBuilder = require('./response-builder')
const errors = require('./errors')

module.exports = Object.assign({
  streamToPromise,
  execToPromise,
  ResponseBuilder,
}, errors)
