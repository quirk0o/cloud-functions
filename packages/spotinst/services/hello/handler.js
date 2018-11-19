module.exports.hello = (event, context, callback) => {
  const body = JSON.parse(event.body)
  callback(null, {
    statusCode: 200,
    body: JSON.stringify({event, hello: body.name, key: process.env.key}),
    headers: {'Content-Type': 'application/json'}
  })
}
