module.exports = (size) => {
  if (size % 8 !== 0) {
    throw new Error(`Size must be a multiple of 8 but received: ${size}.`)
  }

  const randomBytes = () => Math.random().toString(36).substring(2, 10)

  const chunks = size / 8

  return Array(chunks).fill(null).map(randomBytes).join('')
}
