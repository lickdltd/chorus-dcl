import { getParcel, SceneParcels } from '@decentraland/ParcelIdentity'
import { FlatFetchResponse, signedFetch } from '@decentraland/SignedFetch'
import * as utils from '@dcl/ecs-scene-utils'
import { Logger } from './logger'

export class Player extends Entity {
  private readonly _stream: string

  private _parcels: string[] = []

  private _url: string

  private _autoplay: boolean

  private _volume: number

  private _heartbeat: boolean

  private _activated: boolean

  private static URL_DEFAULT: string = 'https://chorus.lickd.co'

  private static ACTIVATE_INTERVAL: number = 1000

  private static TRIGGER_INTERVAL: number = 100

  private static HEARTBEAT_INTERVAL: number = 60000

  public constructor(stream: string, parcels: string[] = []) {
    Logger.log('player initialising')

    super()

    engine.addEntity(this)

    this._stream = stream
    this._parcels = parcels

    this.setUrl(Player.URL_DEFAULT)
    this.setAutoplay(true)
    this.setVolume(1.0)
    this.setHeartbeat(true)

    Logger.log('player initialised')
  }

  public setUrl(url: string): this {
    this._url = url

    return this
  }

  public setAutoplay(autoplay: boolean): this {
    this._autoplay = autoplay

    return this
  }

  public setVolume(volume: number): this {
    this._volume = volume > 0.0 && volume <= 1.0 ? volume : 1.0

    return this
  }

  public setHeartbeat(heartbeat: boolean): this {
    this._heartbeat = heartbeat

    return this
  }

  public isConnected(): boolean {
    return this.hasComponent(AudioStream) && this.getComponent(AudioStream).playing
  }

  public isPlaying(): boolean {
    return this.isConnected() && this.getComponent(AudioStream).volume > 0.0
  }

  private isActiveInScene(): boolean {
    const x: number = Math.floor(Camera.instance.worldPosition.x / 16)
    const z: number = Math.floor(Camera.instance.worldPosition.z / 16)

    return this._parcels.indexOf([x, z].join(',')) >= 0
  }

  public play(): void {
    Logger.log('player play triggered')

    if (this._activated === undefined) {
      Logger.log('activation not triggered')
      return
    }

    if (!this._activated || !this.isConnected()) {
      Logger.log('waiting for player connection')
      utils.setTimeout(Player.ACTIVATE_INTERVAL, () => this.play())
      return
    }

    this.getComponent(AudioStream).volume = this._volume

    Logger.log('player playing successfully')
  }

  public pause(): void {
    Logger.log('player pause triggered')

    if (!this.isConnected()) {
      Logger.log('player not yet connected')
      return
    }

    this.getComponent(AudioStream).volume = 0

    Logger.log('player paused successfully')
  }

  public activate(): this {
    Logger.log('player activating')

    this._activated = false

    this.addComponent(
      new utils.Interval(Player.ACTIVATE_INTERVAL, async () => {
        const x: number = Camera.instance.position.x !== 0 ? Camera.instance.position.x : -1
        const y: number = Camera.instance.position.y !== 0 ? Camera.instance.position.y : -1
        const z: number = Camera.instance.position.z !== 0 ? Camera.instance.position.z : -1

        if (x < 0 && y < 0 && z < 0) {
          Logger.log('player activation waiting - no camera activity yet')
          return
        }

        this.removeComponent(utils.Interval)

        this.createTriggerArea((await getParcel()).land.sceneJsonData.scene)

        Logger.log('player activated successfully')
      })
    )

    this._activated = true

    return this
  }

  private createTriggerArea(scene: SceneParcels) {
    const baseSplit: string[] = scene.base.split(',', 2)
    const baseOffset: Vector3 = new Vector3(parseInt(baseSplit[0]), 0, parseInt(baseSplit[1]))
    const height: number = Math.round((Math.log(scene.parcels.length + 1) / Math.log(2)) * 20)

    if (this._parcels.length <= 0) {
      this._parcels = scene.parcels
    }

    this._parcels.forEach((parcel) => {
      if (scene.parcels.indexOf(parcel) < 0) {
        Logger.log(parcel, 'parcel does NOT belong to scene, skipping')
        return
      }

      Logger.log(parcel, 'parcel does belong to scene')

      const parcelSplit: string[] = parcel.split(',', 2)
      const box: Entity = new Entity()

      const size: Vector3 = new Vector3(16, height, 16)
      const position: Vector3 = new Vector3(
        (parseInt(parcelSplit[0]) - baseOffset.x) * 16 + 8,
        0,
        (parseInt(parcelSplit[1]) - baseOffset.z) * 16 + 8
      )

      box.addComponent(
        new utils.TriggerComponent(new utils.TriggerBoxShape(size, position), {
          onCameraEnter: () => utils.setTimeout(Player.TRIGGER_INTERVAL, () => this.connect(this._autoplay)),
          onCameraExit: () => utils.setTimeout(Player.TRIGGER_INTERVAL, () => this.disconnect())
        })
      )

      engine.addEntity(box)
    })
  }

  private async connect(play: boolean) {
    Logger.log('player connect triggered')

    if (this.isPlaying()) {
      Logger.log('player connect skipped - listener already connected to player')
      return
    } else if (!this.isActiveInScene()) {
      Logger.log('player connect skipped - listener is not active in scene')
      return
    }

    Logger.log('player connecting to stream', this._stream)

    try {
      const response: FlatFetchResponse = await signedFetch(this._url + '/api/session/create/dcl', {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify({
          stream: this._stream
        })
      })

      if (response.status !== 200) {
        throw new Error('session could not be created')
      }

      const json: any = await JSON.parse(response.text || '{}')

      if (!json.token) {
        throw new Error('session token not found')
      }

      this.addComponentOrReplace(new AudioStream(this._url + this._stream + '?token=' + json.token))

      this.pause()
      if (play) {
        this.play()
      }

      Logger.log('player connected successfully')

      if (this._heartbeat) {
        Logger.log('heartbeat starting')
        this.addComponentOrReplace(
          new utils.Interval(Player.HEARTBEAT_INTERVAL, async () => await this.heartbeatPulse(json.token))
        )
        Logger.log('heartbeat started successfully')
      } else {
        Logger.log('heartbeat disabled - this will likely result in listeners getting disconnected')
      }
    } catch (e) {
      Logger.log('player failed to connect', e.message)
    }
  }

  private disconnect(force: boolean = false) {
    Logger.log('player disconnect triggered')

    if (!force && this.isPlaying() && this.isActiveInScene()) {
      Logger.log('player disconnect skipped - listener connected to player and is still active in scene')
      return
    }

    Logger.log('player disconnecting')

    if (this.hasComponent(AudioStream)) {
      this.removeComponent(AudioStream)
    }

    if (this.hasComponent(utils.Interval)) {
      this.removeComponent(utils.Interval)
    }

    Logger.log('player disconnected successfully')
  }

  private async reconnect() {
    Logger.log('player reconnect triggered')

    const wasPlaying = this.isPlaying()

    this.disconnect(true)
    await this.connect(this._autoplay || wasPlaying)

    Logger.log('player reconnected successfully')
  }

  private async heartbeatPulse(token: string) {
    Logger.log('heartbeat pulsing')

    let active: boolean

    try {
      const response: FlatFetchResponse = await signedFetch(this._url + '/api/session/heartbeat/dcl', {
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
      await this.reconnect()
    }
  }
}
