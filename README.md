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
* [Usage](#usage)

## Details

Lickd Chorus DCL includes helpful solutions for integration with Lickd's Chorus service in a Decentraland scene.

## Install

To use any of the helpers provided by this library:

1. Install it as an `npm` package. Run this command in your scene's project folder:

   ```shell
   npm install https://github.com/lickdltd/chorus-dcl/tree/sdk7
   npm install -B @dcl-sdk/utils
   ```

   > Note: This command also installs the latest version of the `@dcl-sdk/utils` library, that are dependencies of the chorus-dcl library

2. Run `dcl start` or `dcl build` so the dependencies are correctly installed.

3. Add this line at the start of your `game.ts` file, or any other TypeScript files that require it:

   ```ts
   import * as chorus from '@lickd/chorus-dcl'
   ```

4. In your TypeScript file, write `chorus.` and let the suggestions of your IDE show the available helpers.

## Usage

```ts
import * as chorus from '@lickd/chorus-dcl'

export function main() {
  new chorus.Stream()
}
```
