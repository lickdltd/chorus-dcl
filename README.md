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

#### Basic

This example uses Player to initialise, start and stop the player as well as initiate the heartbeat:

```ts
import * as chorus from '@lickdltd/chorus-dcl'

(new chorus.Player('<CHORUS_STREAM_PATH>')).activate()
```

#### Change Chorus URL

This example allows for changing the URL for the Chorus service:

```ts
import * as chorus from '@lickdltd/chorus-dcl'

(new chorus.Player('<CHORUS_STREAM_PATH>')).setUrl('<CHORUS_URL>').activate()
```

## Contributing

In order to test changes made to this repository in active scenes, do the following:

1. Run `npm link` on this repository
2. On the scene directory, after you installed the dependency, run `npm link @lickdltd/chorus-dcl`

> Note: When done testing, run `npm unlink --no-save @lickdltd/chorus-dcl` on your scene, so that it no longer depends on your local copy of the library.

For more information, see Decentraland docs for [fast iterations](https://docs.decentraland.org/creator/development-guide/create-libraries/#fast-iterations). 

## Copyright info

This scene is protected with a standard Apache 2 licence. See the terms and conditions in the [LICENSE](/LICENSE) file.
