const axios = require('axios')
const { promisify } = require('util')
const stayAwake = require('stay-awake')
const { fahrenheit, format, loadConfig, log, sleep } = require('./utils')

const preventSleep = promisify(stayAwake.prevent.bind(stayAwake))
const allowSleep = promisify(stayAwake.allow.bind(stayAwake))

const {
  IFTTT: { OFF_EVENT, ON_EVENT, WEBHOOK_KEY },
  NEST: { EMAIL, PASSWORD, SENSOR_SERIAL_NO },
  STAY_AWAKE,
  TEMP: { OFF: OFF_TEMP, ON: ON_TEMP },
  TIME: { MAX_EXECUTION, POLL_INTERVAL },
} = loadConfig()

const getAuthInfo = async () => {
  try {
    const { data } = await axios.post('https://home.nest.com/session', {
      email: EMAIL,
      password: PASSWORD,
    })

    return {
      authToken: data.access_token,
      userId: data.userid,
    }
  } catch (err) {
    log.error(
      'Failed to log into Nest. Make sure credentials are correct and 2FA is disabled.'
    )
    throw err
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

const getRoomBucket = (buckets, serialNo) => {
  const bucket = buckets.find(bucket => bucket.value.serial_number === serialNo)

  if (!bucket) {
    throw new Error(
      `Could not find a Nest sensor with the given serial number: ${serialNo}.`
    )
  }

  return bucket
}

const switchHeater = async on => {
  const event = on ? ON_EVENT : OFF_EVENT
  const url = `https://maker.ifttt.com/trigger/${event}/with/key/${WEBHOOK_KEY}`

  try {
    await axios.get(url)
  } catch (err) {
    log.error(
      'Failed to trigger IFTTT event. Make sure your webhook key is correct.'
    )
    throw err
  }

  log.event(`Turned ${on ? 'on' : 'off'} heater`)
}

const run = async () => {
  const startedAt = Date.now()
  log.event('Starting')

  if (STAY_AWAKE) {
    try {
      await preventSleep()
    } catch (err) {
      log.error(
        'Failed to prevent computer sleep. You may need to set STAY_AWAKE to false.'
      )
      throw err
    }
  }

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

run()
  .catch(async err => {
    log.error(err)

    try {
      await switchHeater(false)
    } catch (err) {
      log.error(err)
    }

    process.exit(1)
  })
  .finally(() => {
    if (STAY_AWAKE) {
      allowSleep()
    }
  })

process.on('SIGINT', async () => {
  await switchHeater(false)

  if (STAY_AWAKE) {
    await allowSleep()
  }

  process.exit(0)
})
