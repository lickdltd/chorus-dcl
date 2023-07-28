import * as utils from '@dcl-sdk/utils'

export class Stream {
    constructor() {
        console.log('chorus stream construstor')

        utils.timers.setTimeout(() => console.log('timer end'), 1000)
    }
}
