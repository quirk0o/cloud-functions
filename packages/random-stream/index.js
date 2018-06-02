const stream = require('stream')

const randomString = require('@quirk0.o/random-string')

module.exports = (size, maxChunkSize) => {
  let i = 1

  const generator = new stream.Readable({
    read() {
      if (i > size) {
        return generator.push(null)
      }

      const chunkSize = i + maxChunkSize <= size ? maxChunkSize : size - i
      generator.push(randomString(chunkSize))
      i += chunkSize
    }
  })

  return generator
}
