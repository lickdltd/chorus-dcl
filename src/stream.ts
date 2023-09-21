import * as utils from '@dcl-sdk/utils'
import { AudioStream, Entity } from '@dcl/sdk/ecs'
import { Api } from './api'
import { TStreamConfig } from './types/stream'
import { Utils } from './utils'

export class Stream {
    private heartbeatId?: number

    constructor(private path: string, private entity: Entity, private api: Api, private config: TStreamConfig) { }

    connect(token: string, onError: () => void) {
        console.log('stream connecting')

        AudioStream.createOrReplace(this.entity, {
            url: Utils.getBaseUrl(this.config.protocol, this.config.domain) + this.path + '.ogg?token=' + token,
            volume: this.config.volume,
            playing: true
        })

        this.heartbeatId = utils.timers.setInterval(() => this.heartbeat(token, onError), 60000)

        console.log('stream connection successful')
    }

    disconnect() {
        console.log('stream disconnecting')

        if (this.heartbeatId) {
            utils.timers.clearInterval(this.heartbeatId)

            delete this.heartbeatId
        }

        if (AudioStream.has(this.entity)) {
            AudioStream.deleteFrom(this.entity)
        }

        console.log('stream disconnection successful')
    }

    private async heartbeat(token: string, onError: () => void) {
        console.log('stream heartbeat')

        try {
            await this.api.heartbeat(token)

            console.log('stream heartbeat successful')
        } catch (e) {
            console.error('stream heartbeat failed')
            console.error(e)

            onError()
        }
    }
}
