# Lickd Chorus DCL Library

> ⚠️ **Warning!**  
> 
> While in version `0.x` there is a chance of breaking changes between minor/patch version.  
> Please be cautious when upgrading between versions and check for any upgrade guides.  
> 
> Once a major version is released, this will no longer be the case and this library will follow [Semantic Versioning](https://semver.org/).

* [Details](#details)
* [Install](#install)
* [Usage](#usage)
* [Contributing](#contributing)
* [Copyright info](#copyright-info)

## Details

Lickd Chorus DCL includes helpful solutions for integration with Lickd's Chorus service in a Decentraland scene.

## Install

To use any of the helpers provided by this library:

1. [Setup GitHub npm registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#installing-a-package)

2. Install it as an npm package. Run this command in your scene's project folder:

   ```
   npm install @dcl/ecs-scene-utils @lickdltd/chorus-dcl -B
   ```

   > Note: This command also installs the latest version of the @dcl/ecs-scene-utils library, that are dependencies of the chorus-dcl library

3. Run `dcl start` or `dcl build` so the dependencies are correctly installed

4. Add this line at the start of your `game.ts` file, or any other TypeScript files that require it:

   ```ts
   import * as chorus from '@lickdltd/chorus-dcl'
   ```

5. Add `USE_FETCH` to `requiredPermissions` list in your `scene.json` file

## Usage

### Player

To use the player add the `Player` component to the entity.

Player requires two arguments when being constructed:

- `stream`: path of the stream connecting to

Player can optionally also take the following argument:

- `config`: an object with optional config parameters
  - `url`: a string to override the player url
  - `volume`: a number to change the volume of the player
  - `parcels`: a list of parcels coordinates to activate the player on
  - `zones`: a list of zone transform objects to activate the player on
  - `debug`: a boolean to enable debug 

#### Basic

This example uses Player to initialise, connect and disconnect the player as well as initiate the heartbeat for the
whole scene:

```ts
import * as chorus from '@lickdltd/chorus-dcl'

new chorus.Player('<CHORUS_STREAM_PATH>')
```

#### Target specific parcel(s)

This example allows for targeting specific parcels rather than the whole scene:

```ts
import * as chorus from '@lickdltd/chorus-dcl'

new chorus.Player('<CHORUS_STREAM_PATH>', { parcels: ['-150,150'] })
```

#### Target designated area

This example allows for targeting designated area rather than the whole scene/parcel:

```ts
import * as utils from '@dcl/ecs-scene-utils'
import * as chorus from '@lickdltd/chorus-dcl'

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

#### Change Chorus URL

This example allows for changing the URL for the Chorus service:

```ts
import * as chorus from '@lickdltd/chorus-dcl'

new chorus.Player('<CHORUS_STREAM_PATH>', {
    url: '<CHORUS_URL>'
})
```

## Contributing

In order to test changes made to this repository in active scenes, do the following:

1. Run `npm link` on this repository
2. On the scene directory, after you installed the dependency, run `npm link @lickdltd/chorus-dcl`

> Note: When done testing, run `npm unlink --no-save @lickdltd/chorus-dcl` on your scene, so that it no longer depends on your local copy of the library.

For more information, see Decentraland docs for [fast iterations](https://docs.decentraland.org/creator/development-guide/create-libraries/#fast-iterations). 

## Copyright info

This scene is protected with a standard Apache 2 licence. See the terms and conditions in the [LICENSE](/LICENSE) file.
