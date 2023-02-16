# Lickd Chorus DCL Library

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
   npm install @dcl/ecs-scene-utils @lickd/chorus-dcl -B
   ```

   > Note: This command also installs the latest version of the @dcl/ecs-scene-utils library, that are dependencies of the chorus-dcl library

2. Run `dcl start` or `dcl build` so the dependencies are correctly installed.

3. Add this line at the start of your `game.ts` file, or any other TypeScript files that require it:

   ```ts
   import * as chorus from '@lickd/chorus-dcl'
   ```

4. In your TypeScript file, write `chorus.` and let the suggestions of your IDE show the available helpers.

## Upgrade

To upgrade this library, please run the following:

```shell
npm install @lickd/chorus-dcl@latest
```

Once an upgrade has taken place it has been known to see the following error triggered in the console when trying to connect:

```shell
[lickd-chorus] connection failed Cannot read properties of null (reading 'signedFetch')
```

If this does happen then please follow these steps:

```shell
npm uninstall @lickd/chorus-dcl -B
npm install @lickd/chorus-dcl -B
```

This will remove all references to this library and reinstall it.

## Usage

### Player

To use the player add the `Player` component to the entity.

Player requires two arguments when being constructed:

- `stream`: path of the stream connecting to

Player can optionally also take the following argument:

- `config`: an object with optional config parameters
  - `url`: a string to override the player url
  - `volume`: a number to change the initial volume of the player when connecting
  - `parcels`: a list of parcels coordinates to activate the player on
  - `zones`: a list of zone transform objects to activate the player on
  - `schedule`: 
    - `start`: a date/time (utc) for when players should get connected
    - `end`: a date/time (utc) for when players should get disconnected
  - `debug`: a boolean to enable debug 

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

new chorus.Player('<CHORUS_STREAM_PATH>', { parcels: ['-150,150'] })
```

#### Target designated area

This example allows for targeting designated area rather than the whole scene/parcel:

```ts
import * as chorus from '@lickd/chorus-dcl'

// update x, y & z accordingly
const scale: Vector3 = new Vector3(9.5, 10, 9.5)
const position: Vector3 = new Vector3(23.5, 0, 8)

// enabling debug will make the trigger component(s) visible
// see https://github.com/decentraland/decentraland-ecs-utils#trigger-component for more information
new chorus.Player('<CHORUS_STREAM_PATH>', {
   zones: [new Transform({scale, position})],
   debug: true
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

### Change volume

This example increases and decreases the volume of the stream based on how close you are to a box:

```ts
import * as utils from '@dcl/ecs-scene-utils'
import * as chorus from '@lickd/chorus-dcl'

const position: Vector3 = new Vector3(16, 0, 16)
const minVolume: number = 0.05
const maxVolume: number = 1.0

const chorusPlayer: chorus.Player = new chorus.Player('<CHORUS_STREAM_PATH>', { volume: minVolume })

const box: Entity = new Entity()

box.addComponent(new BoxShape())
box.addComponent(new Transform({ position }))

engine.addEntity(box)

const max: number = 32

let previousVolume: number = minVolume

for (let i = max; i >= 6; i -= 2) {
    const scale: Vector3 = new Vector3(i, 20, i)

    const volumeEntity: Entity = new Entity()

    const enterVolume: number = maxVolume - ((100 / max) * i) / 100
    const exitVolume: number = previousVolume

    volumeEntity.addComponent(
        new utils.TriggerComponent(new utils.TriggerBoxShape(scale, position), {
            onCameraEnter: () => chorusPlayer.setVolume(enterVolume),
            onCameraExit: () => chorusPlayer.setVolume(exitVolume)
        })
    )

    previousVolume = enterVolume

    engine.addEntity(volumeEntity)
}
```

#### Change Chorus URL

This example allows for changing the URL for the Chorus service:

```ts
import * as chorus from '@lickd/chorus-dcl'

new chorus.Player('<CHORUS_STREAM_PATH>', {
    url: '<CHORUS_URL>'
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
