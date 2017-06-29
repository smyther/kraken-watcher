
const crypto = require('crypto')
const request = require('request')
require('request-debug')(request);

const apiKey = 'xiYX29vDd8SfwzgMgxbhNpxplsgTO8rVyYUhBYLE0dz'
const apiSecret = '8OA1LxI5DjJjEzAvunsSx4YXZlcaSZWZYA9vAsx807z'
const url = 'v2/auth/r/wallets'
const nonce = Date.now().toString()
const body = {}
const rawBody = JSON.stringify(body)

let signature = `/api/${url}${nonce}${rawBody}`

console.log(signature);
signature = crypto
  .createHmac('sha384', apiSecret)
  .update(signature)
  .digest('hex')

  console.log(signature);

const options = {
  url: `https://api.bitfinex.com/${url}`,
  headers: {
    'bfx-nonce': nonce,
    'bfx-apikey': apiKey,
    'bfx-signature': signature
  },
  json: body
}

request.post(options, (error, response, body) => console.log(body))
