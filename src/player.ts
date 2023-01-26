import { getParcel, SceneParcels } from '@decentraland/ParcelIdentity'
import { FlatFetchResponse, signedFetch } from '@decentraland/SignedFetch'
import * as utils from '@dcl/ecs-scene-utils'
import { Logger } from './logger'

export class Player extends Entity {
  private readonly _stream: string

  private _parcels: string[] = []

  private _url: string

  private _autoConnect: boolean

  private _volume: number

  private _heartbeat: boolean

  private _activated: boolean

  private static URL_DEFAULT: string = 'https://chorus.lickd.co'

  private static ACTIVATE_INTERVAL: number = 1000

  private static TRIGGER_INTERVAL: number = 100

  private static HEARTBEAT_INTERVAL: number = 60000

  public constructor(stream: string, parcels: string[] = []) {
    Logger.log('initialising')

    super()

    engine.addEntity(this)

    this._stream = stream
    this._parcels = parcels

    this.setUrl(Player.URL_DEFAULT)
    this.setAutoConnect(true)
    this.setVolume(1.0)
    this.setHeartbeat(true)

    Logger.log('initialised')
  }

  public setUrl(url: string): this {
    this._url = url

    return this
  }

  public setAutoConnect(autoConnect: boolean): this {
    this._autoConnect = autoConnect

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

  private async isActiveInScene(): Promise<boolean> {
    return new Promise((resolve) =>
      utils.setTimeout(Player.ACTIVATE_INTERVAL, () => {
        const x: number = Math.floor(Camera.instance.worldPosition.x / 16)
        const z: number = Math.floor(Camera.instance.worldPosition.z / 16)

        resolve(this._parcels.indexOf([x, z].join(',')) >= 0)
      })
    )
  }

  public activate(): this {
    Logger.log('activate triggered')

    this._activated = false

    this.addComponent(
      new utils.Interval(Player.ACTIVATE_INTERVAL, async () => {
        const x: number = Camera.instance.position.x !== 0 ? Camera.instance.position.x : -1
        const y: number = Camera.instance.position.y !== 0 ? Camera.instance.position.y : -1
        const z: number = Camera.instance.position.z !== 0 ? Camera.instance.position.z : -1

        if (x < 0 && y < 0 && z < 0) {
          Logger.log('activation waiting - no camera activity yet')
          return
        }

        this.removeComponent(utils.Interval)

        const scene: SceneParcels = (await getParcel()).land.sceneJsonData.scene
        if (this._parcels.length <= 0) {
          this._parcels = scene.parcels
        }

        this._parcels.forEach((parcel) => {
          if (scene.parcels.indexOf(parcel) < 0) {
            this._parcels.splice(this._parcels.indexOf(parcel), 1)
          }
        })

        if (this._autoConnect) {
          const baseSplit: string[] = scene.base.split(',', 2)
          const baseOffset: Vector3 = new Vector3(parseInt(baseSplit[0]), 0, parseInt(baseSplit[1]))
          const height: number = Math.round((Math.log(scene.parcels.length + 1) / Math.log(2)) * 20)

          this._parcels.forEach((parcel) => this.activateParcel(baseOffset, height, parcel))
        }

        this._activated = true

        Logger.log('activated successfully')
      })
    )

    return this
  }

  public async connect() {
    Logger.log('connect triggered')

    if (this._activated === undefined) {
      Logger.log('connect skipped - activation not triggered')
      return
    } else if (!this._activated) {
      Logger.log('connect on hold - waiting for activation')
      utils.setTimeout(Player.ACTIVATE_INTERVAL, () => this.connect())
      return
    } else if (this.isConnected()) {
      Logger.log('connect skipped - listener already connected to player')
      return
    } else if (!(await this.isActiveInScene())) {
      Logger.log('connect skipped - listener is not active in scene')
      return
    }

    Logger.log('connecting to', this._stream)

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
      this.getComponent(AudioStream).volume = this._volume

      Logger.log('connected successfully')

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
      Logger.log('connection failed', e.message)
    }
  }

  public async disconnect(force: boolean = false) {
    Logger.log('disconnect triggered')

    if (!this.isConnected()) {
      Logger.log('disconnect skipped - not yet connected')
      return
    } else if (!force && this.isConnected() && (await this.isActiveInScene())) {
      Logger.log('disconnect skipped - listener connected to and is still active in scene')
      return
    }

    Logger.log('disconnecting from', this._stream)

    if (this.hasComponent(AudioStream)) {
      this.removeComponent(AudioStream)
    }

    if (this.hasComponent(utils.Interval)) {
      this.removeComponent(utils.Interval)
    }

    Logger.log('disconnected successfully')
  }

  private activateParcel(baseOffset: Vector3, height: number, parcel: string) {
    Logger.log('activating parcel', parcel)

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
        onCameraEnter: () => utils.setTimeout(Player.TRIGGER_INTERVAL, () => this.connect()),
        onCameraExit: () => utils.setTimeout(Player.TRIGGER_INTERVAL, () => this.disconnect())
      })
    )

    engine.addEntity(box)

    Logger.log('activated parcel successfully')
  }

  private async reconnect() {
    Logger.log('reconnect triggered')

    await this.disconnect(true)
    await this.connect()

    Logger.log('reconnected successfully')
  }

  private async heartbeatPulse(token: string) {
    Logger.log('heartbeat pulse triggered')

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
