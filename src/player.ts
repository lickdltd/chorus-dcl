import {signedFetch} from '@decentraland/SignedFetch'
import * as utils from '@dcl/ecs-scene-utils'

export class Player {
    private _entity: Entity

    private _url: string

    private _stream: string

    private _heartbeat: boolean

    private static URL_DEFAULT = 'https://chorus.lickd.co'

    private static HEARTBEAT_INTERVAL = 60000

    public constructor(entity: Entity, stream: string) {
        this.log('player initialising')

        this.setEntity(entity)
        this.setUrl(Player.URL_DEFAULT)
        this.setStream(stream)
        this.setHeartbeat(true)

        this.log('player initialised')
    }

    public setEntity(entity: Entity) {
        this._entity = entity
    }

    public setUrl(url: string) {
        this._url = url
    }

    public setStream(stream: string) {
        this._stream = stream
    }

    public setHeartbeat(heartbeat: boolean) {
        this._heartbeat = heartbeat
    }

    public async start() {
        this.log('player starting - connecting to stream', this._stream)

        try {
            const response = await signedFetch(this._url + '/api/session/create/dcl', {
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

            this._entity.addComponent(new AudioStream(this._url + this._stream + '?token=' + json.token))

            this.log('player started successfully')

            if (this._heartbeat) {
                this.log('heartbeat starting')
                this._entity.addComponent(new utils.Interval(Player.HEARTBEAT_INTERVAL, async () => await this.heartbeatPulse(json.token)))
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

    private async heartbeatPulse(token: string) {
        this.log('heartbeat pulsing')

        let active

        try {
            const response = await signedFetch(this._url + '/api/session/heartbeat/dcl', {
                headers: {'Content-Type': 'application/json'},
                method: 'POST',
                body: JSON.stringify({token})
            })

            if (response.status === 404) {
                throw new Error('heartbeat not found')
            }

            if (response.status !== 200) {
                throw new Error('unknown error')
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
