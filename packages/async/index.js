const tapP = (fn) => (value) => {
  fn(value)
  return value
}
const tapError = (fn) => (value) => {
  fn(value)
  return Promise.reject(value)
}
const logP = (fn, logger = console) => tapP((value) => logger.log(fn(value)))
const pipeP = (...fns) => fns.reduce((prev, curr) => prev.then(curr), Promise.resolve())

module.exports = {tapP, tapError, pipeP, logP}
