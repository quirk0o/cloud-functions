const stream = require('stream')

module.exports = (size, maxChunkSize) => {
  let i = 0

  const generator = new stream.Readable({
    read() {
      if (i >= size) {
        return generator.push(null)
      }

      const chunkSize = i + maxChunkSize <= size
        ? maxChunkSize
        : size - i
      generator.push('\0'.repeat(chunkSize))
      i += chunkSize
    }
  })

  generator._read = () => {
    if (i >= size) {
      return generator.push(null)
    }

    const chunkSize = i + maxChunkSize <= size
      ? maxChunkSize
      : size - i
    generator.push('\0'.repeat(chunkSize))
    i += chunkSize
  }

  return generator
}
