import {signedFetch} from '@decentraland/SignedFetch'
import * as utils from '@dcl/ecs-scene-utils'

export class Player {
    private readonly _entity: Entity
    private readonly _stream: string
    private readonly _interval: number

    private static URL = 'https://chorus.lickd.co'

    public constructor(entity: Entity, stream: string, interval: number = 60000) {
        this.log('player initialising')

        this._entity = entity
        this._stream = stream
        this._interval = interval

        this.log('player initialised')
    }

    public async start() {
        this.log('player starting - connecting to stream', this._stream)

        try {
            const response = await signedFetch(Player.URL + '/api/session/create/dcl', {
                headers: {'Content-Type': 'application/json'},
                method: 'POST',
                body: JSON.stringify({
                    stream: this._stream
                })
            })

            if (response.status !== 200) {
                throw new Error('session could not be created')
            }

            const json = await JSON.parse(response.text || '{}')

            if (!json.token) {
                throw new Error('session token not found')
            }

            this._entity.addComponent(new AudioStream(Player.URL + this._stream + '?token=' + json.token))

            this.log('player started successfully')

            if (this._interval > 0) {
                this.log('heartbeat starting - with a pulse every', this._interval, 'milliseconds')
                this._entity.addComponent(new utils.Interval(this._interval, async () => await this.heartbeat(json.token)))
                this.log('heartbeat started successfully')
            } else {
                this.log('heartbeat disabled - this will likely result in listeners getting disconnected')
            }
        } catch (e) {
            this.log('player failed to start', e.message)
        }
    }

    public async stop() {
        this.log('player stopping')

        this._entity.removeComponent(AudioStream)
        this._entity.removeComponent(utils.Interval)

        this.log('player stopped successfully')
    }

    private async heartbeat(token: string) {
        this.log('heartbeat pulsing')

        let active

        try {
            const response = await signedFetch(Player.URL + '/api/session/heartbeat/dcl', {
                headers: {'Content-Type': 'application/json'},
                method: 'POST',
                body: JSON.stringify({token})
            })

            if (response.status !== 200) {
                throw new Error()
            }

            this.log('heartbeat pulsed successfully')
            active = true
        } catch (e) {
            this.log('heartbeat failed to pulse', e.message)
            active = false
        }

        if (!active) {
            await this.stop()
        }
    }

    private log(...args: any[]) {
        log('[lickd-chorus]', ...args)
    }
}
