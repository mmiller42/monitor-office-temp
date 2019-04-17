# nest-sensor-heater-control

> Polls a Nest temperature sensor and programmatically controls a space heater to maintain a comfortable temperature in a specific room, using IFTTT webhook triggers that toggle a smart outlet.

⚠️ Integrates an undocumented Nest API which requires a password to authenticate. 2FA must also be disabled.

## Requirements

* Configured Nest thermostat and account at [Nest](https://home.nest.com/)
* Configured temperature sensors for the Nest thermostat
* Configured IFTTT-compatible smart outlet like [this one](https://www.amazon.com/gp/product/B07CVFD2KC/)
* Space heater plugged into the smart outlet
* [IFTTT](https://ifttt.com/) account
* [Git](https://git-scm.com/), [Node.js](https://nodejs.org/), and [Yarn](https://yarnpkg.com/)

## Setup

1. Create an IFTTT applet to turn on the heater.

   1. Set the *this* service to be *Webhooks*.
   1. Choose the *Receive a web request* trigger.
   1. Enter an event name, like `room_too_cold`.
   1. Set the *that* service to activate your smart outlet.

1. Create an IFTTT applet to turn off the heater. Repeat the previous step with a different event name, like `room_too_warm`, and set it to turn off your outlet.

1. Gather required information to configure the app:

    * Your Nest account credentials (email and password). 2FA must be disabled.
    * Your Nest sensor serial number:
        1. Sign into [home.nest.com](https://home.nest.com/).
        1. Click your thermostat, then open *Settings* (gear icon at top right).
        1. Select the target temperature sensor on the left.
        1. Note the *Serial no.* value under *About* &gt; *Technical info*.
    * Your IFTTT Maker webhook key:
        1. Log into IFTTT and navigate to [Maker Webhooks settings](https://ifttt.com/services/maker_webhooks/settings).
        1. Find the *URL* shown on the page. It should begin with `https://maker.ifttt.com/use/`. Your webhook key is the sequence of characters after the `use/` in this URL.

1. Clone this repository.

    ```sh
    git clone https://github.com/mmiller42/monitor-office-temp.git
    cd monitor-office-temp
    ```

1. Install the dependencies.

    ```sh
    yarn
    ```

1. Create a configuration file in the repository root folder called `config.json` or `config.json5`.

    ```sh
    vim config.json5
    ```

    ```json5
    {
      NEST: {
        EMAIL: 'foo@bar.baz',
        PASSWORD: 'Foo42BarBaz!',
        SENSOR_SERIAL_NO: '00AA00AA000000A0',
      },
      IFTTT: {
        WEBHOOK_KEY: 'aaAaAAA0aa_Aa0aAA0aA0A',
        ON_EVENT: 'room_too_cold',
        OFF_EVENT: 'room_too_warm',
      },
      STAY_AWAKE: true,
      TEMP: {
        ON: 63,
        OFF: 66,
      },
    }
    ```

## Configuration

Config values are read from `config.json` or `config.json5` in the repository directory. This file must exist.

The property names may be specified in camelCase (e.g. `ifttt.webhookKey`, `stayAwake`), snake_case (e.g. `ifttt.webhook_key`, `stay_awake`), or UPPER_SNAKE_CASE (e.g. `IFTT.WEBHOOK_KEY`, `STAY_AWAKE`).

Config properties can be selectively overridden with command line arguments:

```sh
yarn start --IFTTT.WEBHOOK_KEY=foobar --STAY_AWAKE
# or
yarn start --ifttt.webhookKey=foobar --stayAwake
```

|Property|Type|Description|Default|
|:-------|:---|:----------|:------|
|`IFTTT.OFF_EVENT`|string|The IFTTT webhook trigger event name to turn heater off|*Required*|
|`IFTTT.ON_EVENT`|string|The IFTTT webhook trigger event name to turn heater on|*Required*|
|`IFTTT.WEBHOOK_KEY`|string|The IFTTT Webhooks service key|*Required*|
|`NEST.EMAIL`|string|The email address associated with your Nest account|*Required*|
|`NEST.PASSWORD`|string|The Nest account password|*Required*|
|`NEST.SENSOR_SERIAL_NO`|string|The serial number of the Nest temperature sensor to monitor|*Required*|
|`STAY_AWAKE`|boolean|Prevent the computer from sleeping so that timer does not pause|`false`|
|`TEMP.OFF`|number|The temperature at which the heater should be turned off (°F)|*Required*|
|`TEMP.ON`|number|The temperature at which the heater should be turned on (°F)|*Required*|
|`TIME.MAX_EXECUTION`|number|The maximum amount of time the program will run before turning off heater and terminating (ms)|`14400000` (4 hours)|
|`TIME.POLL_INTERVAL`|number|The delay between requests for the Nest sensor temperature (ms)|`300000` (5 minutes)|

## Running

Any time you want to run your heater, execute the following command in this repository's directory:

```sh
yarn start
```

This will cycle your heater on and off based on your temperature triggers (`TEMP.ON` and `TEMP.OFF`).

Stop the program at any time by pressing <kbd>Ctrl</kbd><kbd>C</kbd> in the terminal window. It will attempt to turn off the heater before exiting.

If an error occurs, the program will print the error details and crash. It will attempt to turn off the heater before exiting.

The program will automatically exit after `TIME.MAX_EXECUTION` and turn off the heater.
