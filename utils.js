const Ajv = require('ajv')
const chalk = require('chalk')
const json5 = require('json5')
const fs = require('fs')
const path = require('path')

const json5Parse = json5.parse.bind(json5)

const loadFile = (() => {
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
  const ajv = new Ajv({ allErrors: true, useDefaults: true })
  const validate = ajv.compile(
    loadFile(path.join(__dirname, 'configSchema.json5'))
  )

  return config => {
    validate(config)
    if (validate.errors) {
      throw new Error(ajv.errorsText(validate.errors))
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
  const config = loadFile(path.join(__dirname, 'config'))
  return conformConfig(config)
}

exports.log = (() => {
  const stamp = () => `[${new Date().toLocaleTimeString()}]`

  return {
    event: message => console.log(`${stamp()} ${chalk.green(message)}`),
    info: message => console.log(chalk.grey(`${stamp()} ${message}`)),
  }
})()

exports.sleep = time =>
  new Promise(resolve => {
    setTimeout(resolve, time)
  })
