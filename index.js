require('dotenv').config()
const fastify = require('fastify')({ logger: true })
const helmet = require('fastify-helmet')
const moment = require('moment-timezone')
const redis = require('redis').createClient({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD
})

const { getPrayerTime } = require('./lib/prayer')

const data = require('./data/region.json')

fastify.register(
  helmet,
  { contentSecurityPolicy: false }
)

fastify.register(require('fastify-redis'), {
  client: redis,
  closeClient: true
})

fastify.register(require('fastify-rate-limit'), {
  max: 50,
  timeWindow: '1 minute'
})

fastify.get('/ping', async (request, reply) => {
  return { message: 'PONG!!!' }
})

fastify.get('/time/today', async (request, reply) => {
  const city = request.query.city
  if (city === "" || city === undefined) {
    reply
      .code(400)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send({ message: 'Query Parameter city tidak boleh kosong' })
  }

  const region = data[city]
  if (region === undefined) {
    reply
      .code(400)
      .header('Content-Type', 'application/json; charset=utf-8')
      .send({ message: 'Kota atau Kabupaten tidak ditemukan. Mohon untuk mengisi Kota atau Kabupaten yang terdaftar' })
  }

  const prayerTime = getPrayerTime(region)

  const date = new Date()
  const m = moment(date)
  m.tz(region.timezone)
  m.hour(0)
  m.minute(0)
  m.second(0)
  m.millisecond(0)

  redis.get(`${m.unix()}-${city}`, (err, val) => {
    if (err) throw err
    if (val === null) {
      const body = {
        timezone: region.timezone,
        city: city,
        latitude: region.lat,
        longitude: region.lng,
        prayer_time: prayerTime
      }
      redis.set(`${m.unix()}-${city}`, JSON.stringify(body), (err) => {
        if (err) reply
          .code(400)
          .header('Content-Type', 'application/json; charset=utf-8')
          .send({ message: err })
        else {
          redis.expire(`${m.unix()}-${city}`, 86400)
          body.current_unix = moment(date).tz(region.timezone).unix()
          reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send(body)
        }
      })
    } else {
      const body = JSON.parse(val)
      reply
        .code(200)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send({
          ...body,
          current_unix: moment(date).tz(region.timezone).unix()
        })
    }
  })
})

const start = async () => {
  try {
    await fastify.listen(process.env.PORT || 3000)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()
