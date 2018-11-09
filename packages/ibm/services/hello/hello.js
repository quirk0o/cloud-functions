require('dotenv').config()

exports.handler = () => {
  return {status: 200, message: 'Hello World'}
}
