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
    JSON: JSON.parse,
    json5: json5Parse,
    JSON5: json5Parse,
  }

  return basePath => {
    let extension = path.extname(basePath).substr(1)
    let filePath

    if (extension === '') {
      const result = Object.keys(FILE_PARSERS)
        .map(extension => ({
          extension,
          filePath: `${basePath}.${extension}`,
        }))
        .find(({ filePath }) => fs.existsSync(filePath))

      if (!result) {
        throw new Error(
          `Could not find ${basePath}.{${Object.keys(FILE_PARSERS).join(', ')}}`
        )
      }

      ;({ extension, filePath } = result)
    } else {
      filePath = basePath
      if (!FILE_PARSERS[extension]) {
        throw new Error(`Unrecognized file extension ${extension}`)
      }
    }

    const content = fs.readFileSync(filePath, 'utf8')
    const parse = FILE_PARSERS[extension]
    return parse(content)
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
