# Lickd Chorus DCL Documentation

Lickd Chorus DCL includes helpful solutions for integration with Lickd's Chorus service in a Decentraland scene.

## Install

To use any of the helpers provided by this library:

1. Install it as an npm package. Run this command in your scene's project folder:

   ```
   npm install @dcl/ecs-scene-utils @lickdltd/chorus-dcl -B
   ```

Note: This command also installs the latest version of the @dcl/ecs-scene-utils library, that are dependencies of the chorus-dcl library

2. Add this line at the start of your game.ts file, or any other TypeScript files that require it:

   ```ts
   import * as chorus from '@lickdltd/chorus-dcl'
   ```

## Usage

### Player

To use the player add the `Player` component to the entity.

Player requires two arguments when being constructed:

- `entity`: Entity for the player
- `stream`: path of the stream connecting to

Player can optionally also take the following argument:

- `interval`: duration (in seconds) for the heartbeat interval

This example uses Player to do initialise, start and stop the player as well as initiate the heartbeat:

```ts
import { getUserData } from '@decentraland/Identity'
import * as chorus from '@lickdltd/chorus-dcl'

void executeTask(async () => {
   const chorusEntity = new Entity()
   const chorusPlayer = new chorus.Player(chorusEntity, '/genre/mixed.mp3')
   const me = await getUserData()

   await chorusPlayer.start()

   onEnterSceneObservable.add(async (player) => {
      if (player.userId === me?.userId) {
         await chorusPlayer.start()
      }
   })

   onLeaveSceneObservable.add(async (player) => {
      if (player.userId === me?.userId) {
         await chorusPlayer.stop()
      }
   })

   engine.addEntity(chorusEntity)
})
```

## Copyright info

This scene is protected with a standard Apache 2 licence. See the terms and conditions in the [LICENSE](/LICENSE) file.
