# monitor-office-temp

> Uses Nest temperature sensors to programmatically control a space heater to maintain a comfortable temperature in a specific room, using IFTTT webhook triggers to control a smart outlet.

⚠️ Integrates an undocumented Nest API which requires a password to authenticate. 2FA must also be disabled.

## Prerequisites

* Configured Nest thermostat and account at [Nest](https://home.nest.com/)
* Configured temperature sensors for the Nest thermostat
* Configured IFTTT-compatible smart outlet like [this one](https://www.amazon.com/gp/product/B07CVFD2KC/)
* Space heater plugged into the smart outlet
* A free [IFTTT](https://ifttt.com/) account

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

1. Create a configuration file in the repository root folder called `config.json` or `config.json5`. See the [config schema](./configSchema.json5) for a full description of each config option.
    ```sh
    vim config.json5
    ```

    ```json5
   {
     NEST: {
       EMAIL: 'foo@bar.baz',
       PASSWORD: 'Foo42BarBaz!',
       SENSOR_SERIAL_NO: '00AA00AA000000A0'
     },
     IFTTT: {
       WEBHOOK_KEY: 'aaAaAAA0aa_Aa0aAA0aA0A',
       ON_EVENT: 'room_too_cold',
       OFF_EVENT: 'room_too_warm'
     },
     TEMP: {
       ON: 63,
       OFF: 66
     }
   }
   ```

## Running

Any time you want to run your heater, execute the following command in this repository's directory:

```sh
yarn start
```

This will cycle your heater on and off based on your temperature triggers (`TEMP.ON` and `TEMP.OFF`).

Stop the program at any time by pressing <kbd>Ctrl</kbd><kbd>C</kbd> in the terminal window.

If an error occurs, the program will print the error details and crash. You may need to manually turn off your heater.

The program will automatically exit after `TIME.MAX_EXECUTION` and turn off the heater.
