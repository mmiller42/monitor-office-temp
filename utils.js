const Ajv = require('ajv')
const betterAjvErrors = require('better-ajv-errors')
const chalk = require('chalk')
const deepMapKeys = require('deep-map-keys')
const json5 = require('json5')
const fs = require('fs')
const { merge, snakeCase } = require('lodash')
const minimist = require('minimist')
const path = require('path')
const PrettyError = require('pretty-error')

const loadFile = (() => {
  const json5Parse = json5.parse.bind(json5)

  const FILE_PARSERS = {
    json: JSON.parse,
    json5: json5Parse,
  }

  const EXTENSIONS = Object.keys(FILE_PARSERS).reduce((extensions, type) => {
    extensions.push(type)
    extensions.push(type.toUpperCase())
    return extensions
  }, [])

  return basePath => {
    let type = path
      .extname(basePath)
      .substr(1)
      .toLowerCase()
    let filePath

    if (type === '') {
      const result = EXTENSIONS.map(extension => ({
        type: extension.toLowerCase(),
        filePath: `${basePath}.${extension}`,
      })).find(({ filePath }) => fs.existsSync(filePath))

      if (!result) {
        throw new Error(`Could not find ${basePath}.{${EXTENSIONS.join(',')}}`)
      }

      ;({ type, filePath } = result)
    } else {
      filePath = basePath
      if (!FILE_PARSERS[type]) {
        throw new Error(`Unrecognized file extension ${type}`)
      }
    }

    const content = fs.readFileSync(filePath, 'utf8')
    const parse = FILE_PARSERS[type]

    try {
      return parse(content)
    } catch (err) {
      console.error(
        `Failed to parse ${filePath} config as ${type.toUpperCase()}.`
      )
      throw err
    }
  }
})()

const conformConfig = (() => {
  const ajv = new Ajv({
    allErrors: true,
    coerceTypes: true,
    jsonPointers: true,
    removeAdditional: true,
    useDefaults: true,
  })

  const schema = loadFile(path.join(__dirname, 'configSchema.json5'))
  const validate = ajv.compile(schema)

  return config => {
    if (!validate(config)) {
      throw new Error(
        betterAjvErrors(schema, config, validate.errors, {
          indent: 2,
        })
      )
    }
    return config
  }
})()

exports.fahrenheit = celsius => (9 / 5) * celsius + 32

exports.format = n => {
  const rounded = String(Math.round(n * 10) / 10)
  return `${rounded}${rounded.includes('.') ? '' : '.0'}°F`
}

exports.loadConfig = () => {
  const normalizeConfigKeys = config =>
    deepMapKeys(config, key => snakeCase(key).toUpperCase())

  const fileConfig = loadFile(path.join(__dirname, 'config'))
  const [, , ...cliArgs] = process.argv
  const overrides = minimist(cliArgs)

  return conformConfig(
    merge({}, normalizeConfigKeys(fileConfig), normalizeConfigKeys(overrides))
  )
}

exports.log = (() => {
  const prettyError = new PrettyError()
  const stamp = () => `[${new Date().toLocaleTimeString()}]`

  return {
    error: message => {
      if (typeof message === 'string') {
        console.error(`${stamp()} ${chalk.red(message)}`)
      } else {
        console.error(prettyError.render(message))
      }
    },
    event: message => console.log(`${stamp()} ${chalk.green(message)}`),
    info: message => console.log(chalk.grey(`${stamp()} ${message}`)),
  }
})()

exports.sleep = time =>
  new Promise(resolve => {
    setTimeout(resolve, time)
  })
