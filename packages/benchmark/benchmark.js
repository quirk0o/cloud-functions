const {pipeP, logP, tapError} = require('@quirk0.o/async')

class Benchmark {
  constructor(logger = console) {
    this._keys = []
    this._queue = []
    this._response = {}
    this._time = {}
    this._logger = logger
  }

  do(key) {
    this._keys.push(key)
    return (...fns) => {
      this._queue.push(this._task(key, fns))
      return this
    }
  }

  json() {
    return pipeP(...this._queue)
      .then(() => Object.assign(
        {
          ts: (new Date()).toString(),
          time: this._time
        },
        this._keys
          .map(key => ({[key]: this._response[key]}))
          .reduce((acc, response) => Object.assign(acc, response), {})
      ))
  }

  _task(key, fns) {
    return () => {
      let hrtime = process.hrtime()
      return pipeP(...fns)
        .then(() => this._time[key] = process.hrtime(hrtime))
        .then(logP(() => `${key} finished`, this._logger))
        .catch(tapError(logP(err => `${key} error: ${err.stack}}`, this._logger)))
        .catch(error => this._response[key] = {error: error.message || error.stack || error })
    }
  }
}

module.exports = Benchmark
