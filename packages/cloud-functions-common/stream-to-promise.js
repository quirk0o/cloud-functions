function streamToPromise(stream) {
  return new Promise((resolve, reject) => {
    stream
      .on('error', function (err) {
        reject(err)
      })
      .on('end', function () {
        resolve()
      })
  })
}

module.exports = streamToPromise
