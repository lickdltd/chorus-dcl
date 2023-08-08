# Lickd Chorus DCL Library

> ⚠️ SDK7 WIP

> ⚠️ **Warning!**  
> 
> While in version `0.x` there is a chance of breaking changes between minor/patch version.  
> Please be cautious when upgrading between versions and check for any upgrade guides.  
> 
> Once a major version is released, this will no longer be the case and this library will follow [Semantic Versioning](https://semver.org/).

* [Details](#details)
* [Install](#install)
* [Upgrade](#upgrade)
* [Usage](#usage)
* [Contributing](#contributing)
* [Copyright info](#copyright-info)

## Details

Lickd Chorus DCL includes helpful solutions for integration with Lickd's Chorus service in a Decentraland scene.

## Install

To use any of the helpers provided by this library:

1. Install it as an `npm` package. Run this command in your scene's project folder:

   ```shell
   npm install @lickd/chorus-dcl@beta
   npm install -B @dcl-sdk/utils
   ```

   > Note: This command also installs the latest version of the @dcl/ecs-scene-utils library, that are dependencies of the chorus-dcl library

2. Run `npm start` or `npm run build` so the dependencies are correctly installed.

3. Add this line at the start of your `index.ts` file, or any other TypeScript files that require it:

   ```ts
   import * as chorus from '@lickd/chorus-dcl'
   ```

4. In your TypeScript file, write `chorus.` and let the suggestions of your IDE show the available helpers.

## Upgrade

To upgrade this library, please run the following:

```shell
npm install @lickd/chorus-dcl@beta
```

## Usage

### Player

To use the player add the `Player` component to the entity.

Player requires two arguments when being constructed:

- `path`: the path of the stream connecting to

Player can optionally also take the following argument:

- `config`: an object with optional config parameters
  - `domain`: a string to override the player domain
  - `volume`: a number to change the initial volume of the player when connecting
  - `parcels`: a list of parcels coordinates to activate the player on
  - `areas`: a list of areas to activate the player on
  - `schedule`: 
    - `start`: a date/time (utc) for when players should get connected
    - `end`: a date/time (utc) for when players should get disconnected

#### Basic

This example uses Player to initialise, connect and disconnect the player as well as initiate the heartbeat for the
whole scene:

```ts
import * as chorus from '@lickd/chorus-dcl'

new chorus.Player('<CHORUS_STREAM_PATH>')
```

#### Target specific parcel(s)

This example allows for targeting specific parcels rather than the whole scene:

```ts
import * as chorus from '@lickd/chorus-dcl'

new chorus.Player('<CHORUS_STREAM_PATH>', { 
   parcels: ['-150,150'] 
})
```

#### Target designated area

This example allows for targeting designated area rather than the whole scene/parcel:

```ts
import * as chorus from '@lickd/chorus-dcl'

// update x, y & z accordingly
const position: Vector3 = Vector3.create(9.5, 0.0, 9.5)
const scale: Vector3 = Vector3.create(16, 10, 16)

new chorus.Player('<CHORUS_STREAM_PATH>', {
   areas: [{ type: 'box', position, scale }]
})
```

### Set schedule

This example allows for only connecting after a scheduled date/time:

```ts
import * as chorus from '@lickd/chorus-dcl'

// See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#examples
// const dateTimeStart = new Date('0000-00-00T00:00:00')
// const dateTimeEnd = new Date('0000-00-00T00:00:00')
const dateTimeStart = new Date()
const dateTimeEnd = new Date()

// these are just an examples and not likely to be a real scenario
dateTimeStart.setMinutes(dateTime.getMinutes() + 1)
dateTimeEnd.setMinutes(dateTime.getMinutes() + 10)

new chorus.Player('<CHORUS_STREAM_PATH>', { 
    schedule: { 
        start: dateTimeStart,
        end: dateTimeEnd // optional
    }
})
```

#### Change Chorus domain

This example allows for changing the domain for the Chorus service:

```ts
import * as chorus from '@lickd/chorus-dcl'

new chorus.Player('<CHORUS_STREAM_PATH>', {
    domain: '<CHORUS_URL>'
})
```

## Contributing

In order to test changes made to this repository in active scenes, do the following:

1. Run `npm link` on this repository
2. On the scene directory, after you installed the dependency, run `npm link @lickd/chorus-dcl`

> Note: When done testing, run `npm unlink --no-save @lickd/chorus-dcl` on your scene, so that it no longer depends on your local copy of the library.

For more information, see Decentraland docs for [fast iterations](https://docs.decentraland.org/creator/development-guide/create-libraries/#fast-iterations). 

## Copyright info

This scene is protected with a standard Apache 2 licence. See the terms and conditions in the [LICENSE](/LICENSE) file.
