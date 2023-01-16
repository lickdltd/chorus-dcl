import { getUserData } from '@decentraland/Identity'
import { signedFetch } from '@decentraland/SignedFetch'
import * as utils from '@dcl/ecs-scene-utils'
import { Logger } from './logger'

export class Player extends Entity {
  private _stream: string

  private _url: string

  private _heartbeat: boolean

  private static URL_DEFAULT = 'https://chorus.lickd.co'

  private static HEARTBEAT_INTERVAL = 60000

  public constructor(stream: string) {
    Logger.log('player initialising')

    super()

    engine.addEntity(this)

    this.setStream(stream)
    this.setUrl(Player.URL_DEFAULT)
    this.setHeartbeat(true)

    Logger.log('player initialised')
  }

  public setStream(stream: string): this {
    this._stream = stream

    return this
  }

  public setUrl(url: string): this {
    this._url = url

    return this
  }

  public setHeartbeat(heartbeat: boolean): this {
    this._heartbeat = heartbeat

    return this
  }

  public async activate() {
    Logger.log('player activating')

    const me = await getUserData()

    onSceneReadyObservable.add(async () => {
      await this.start()
    })

    onEnterSceneObservable.add(async (player) => {
      if (player.userId === me?.userId) {
        await this.start()
      }
    })

    onLeaveSceneObservable.add(async (player) => {
      if (player.userId === me?.userId) {
        await this.stop()
      }
    })

    Logger.log('player activated successfully')
  }

  private async start() {
    Logger.log('player starting - connecting to stream', this._stream)

    try {
      const response = await signedFetch(this._url + '/api/session/create/dcl', {
        headers: { 'Content-Type': 'application/json' },
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

      this.addComponent(new AudioStream(this._url + this._stream + '?token=' + json.token))

      Logger.log('player started successfully')

      if (this._heartbeat) {
        Logger.log('heartbeat starting')
        this.addComponent(
          new utils.Interval(Player.HEARTBEAT_INTERVAL, async () => await this.heartbeatPulse(json.token))
        )
        Logger.log('heartbeat started successfully')
      } else {
        Logger.log('heartbeat disabled - this will likely result in listeners getting disconnected')
      }
    } catch (e) {
      Logger.log('player failed to start', e.message)
    }
  }

  private stop() {
    Logger.log('player stopping')

    if (this.hasComponent(AudioStream)) {
      this.removeComponent(AudioStream)
    }

    if (this.hasComponent(utils.Interval)) {
      this.removeComponent(utils.Interval)
    }

    Logger.log('player stopped successfully')
  }

  private async heartbeatPulse(token: string) {
    Logger.log('heartbeat pulsing')

    let active

    try {
      const response = await signedFetch(this._url + '/api/session/heartbeat/dcl', {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify({ token })
      })

      if (response.status === 404) {
        throw new Error('heartbeat not found')
      }

      if (response.status !== 200) {
        throw new Error('unknown error')
      }

      Logger.log('heartbeat pulsed successfully')
      active = true
    } catch (e) {
      Logger.log('heartbeat failed to pulse', e.message)
      active = false
    }

    if (!active) {
      await this.stop()
    }
  }
}
