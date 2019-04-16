const axios = require('axios')

const { fahrenheit, format, loadConfig, log, sleep } = require('./utils')

const {
  IFTTT: { OFF_EVENT, ON_EVENT, WEBHOOK_KEY },
  NEST: { EMAIL, PASSWORD, SENSOR_SERIAL_NO },
  TEMP: { OFF: OFF_TEMP, ON: ON_TEMP },
  TIME: { MAX_EXECUTION, POLL_INTERVAL },
} = loadConfig()

const getAuthInfo = async () => {
  const { data } = await axios.post('https://home.nest.com/session', {
    email: EMAIL,
    password: PASSWORD,
  })

  return {
    authToken: data.access_token,
    userId: data.userid,
  }
}

const getBucketData = async ({ authToken, userId }) =>
  (await axios.post(
    `https://home.nest.com/api/0.1/user/${userId}/app_launch`,
    {
      known_bucket_types: ['kryptonite'],
      known_bucket_versions: [],
    },
    {
      headers: {
        authorization: `Basic ${authToken}`,
      },
    }
  )).data.updated_buckets

const getRoomBucket = (buckets, serialNo) =>
  buckets.find(bucket => bucket.value.serial_number === serialNo)

const switchHeater = async on => {
  const event = on ? ON_EVENT : OFF_EVENT
  const url = `https://maker.ifttt.com/trigger/${event}/with/key/${WEBHOOK_KEY}`
  await axios.get(url)
  log.event(`Turned ${on ? 'on' : 'off'} heater`)
}

const run = async () => {
  const startedAt = Date.now()
  log.event('Starting')

  let on = null
  const authInfo = await getAuthInfo()

  do {
    const buckets = await getBucketData(authInfo)
    const room = getRoomBucket(buckets, SENSOR_SERIAL_NO)

    const temperature = fahrenheit(room.value.current_temperature)

    log.info(`Current temperature is ${format(temperature)}`)

    if (temperature < ON_TEMP && !on) {
      on = true
      switchHeater(on)
    } else if (temperature > OFF_TEMP && (on || on === null)) {
      on = false
      switchHeater(on)
    }

    await sleep(POLL_INTERVAL)
  } while (Date.now() - startedAt < MAX_EXECUTION)

  log.event('Automatically turning off')
  await switchHeater(false)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
