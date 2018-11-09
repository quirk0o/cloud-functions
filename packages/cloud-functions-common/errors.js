class MissingParamError extends Error {
  constructor(param) {
    super(`Missing required param: ${param}`)
    Error.captureStackTrace(this, MissingParamError)
  }
}

module.exports = {MissingParamError}
