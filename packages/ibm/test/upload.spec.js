const request = require('axios')

const baseUrl = 'https://service.us.apiconnect.ibmcloud.com/gws/apigateway/api'
const apiId = '79fcf6ebf02e88f3cfac59ae37ec551b193961b2b82d1e0bbce94f6c69323150'
const service = `serverless-research`
const fn = `upload-512`
const url = `${baseUrl}/${apiId}/${service}/${fn}`
const size = '1MB'

jest.setTimeout(20000)

describe('upload', () => {
  it('tests upload speed', async () => {
    try {
      const response = await request.post(url, {size})
      expect(response.status).toEqual(200)

      const data = response.data
      console.log(data)
      expect(data.ts).toBeDefined()
      expect(data.upload && data.upload.error).not.toBeDefined()
      expect(data.time).toBeDefined()
      expect(data.time.upload).toBeInstanceOf(Array)
      expect(data.time.upload).toHaveLength(2)
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
