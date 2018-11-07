const config = require('config')

const request = require('axios')

const apiEndpoint = config.get('apiEndpoint')
const service = config.get('service')
const apiId = '79fcf6ebf02e88f3cfac59ae37ec551b193961b2b82d1e0bbce94f6c69323150'
const fn = `download`
const memories = [128, 256, 512]
const url = (memory) => `${apiEndpoint}/${apiId}/${service}-transfer/${fn}-${memory}`

console.log(url(512))
const size = '1MB'

jest.setTimeout(20000)

describe('download', () => {
  memories.forEach((memory) => {
    describe(`${memory}MB`, () => {
      it('tests download speed', async () => {
        try {
          const response = await request.post(url(memory), {size})
          expect(response.status).toEqual(200)

          const data = response.data
          console.log(data)
          expect(data.ts).toBeDefined()
          expect(data.download && data.download.error).not.toBeDefined()
          expect(data.time).toBeDefined()
          expect(data.time.download).toBeInstanceOf(Array)
          expect(data.time.download).toHaveLength(2)
        } catch (error) {
          if (error.response) {
            return Promise.reject(`Request failed with status code: ${error.response.status} ${error.response.statusText}.\nThe response was: \n${JSON.stringify(error.response.data)}`)
          } else if (error.request) {
            return Promise.reject(`Request failed: ${error.message}`)
          } else {
            return Promise.reject(`Unexpected error: ${error.message}`)
          }
        }
      })
    })
  })
})
