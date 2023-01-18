import { getParcel, SceneParcels } from '@decentraland/ParcelIdentity'
import { FlatFetchResponse, signedFetch } from '@decentraland/SignedFetch'
import * as utils from '@dcl/ecs-scene-utils'
import { Logger } from './logger'

export class Player extends Entity {
  private _stream: string

  private _url: string

  private _heartbeat: boolean

  private _parcels: string[] = []

  private static URL_DEFAULT: string = 'https://chorus.lickd.co'

  private static ACTIVATE_INTERVAL: number = 1000

  private static TRIGGER_INTERVAL: number = 100

  private static HEARTBEAT_INTERVAL: number = 60000

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

  public isActiveInScene(): boolean {
    const x: number = Math.floor(Camera.instance.worldPosition.x / 16)
    const z: number = Math.floor(Camera.instance.worldPosition.z / 16)

    return this._parcels.indexOf([x, z].join(',')) >= 0
  }

  public isPlaying(): boolean {
    return this.hasComponent(AudioStream)
  }

  public activate() {
    Logger.log('player activating')

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
  }

  private createTriggerArea(scene: SceneParcels) {
    const baseSplit: string[] = scene.base.split(',', 2)
    const baseOffset: Vector3 = new Vector3(parseInt(baseSplit[0]), 0, parseInt(baseSplit[1]))
    const height: number = Math.round((Math.log(scene.parcels.length + 1) / Math.log(2)) * 20)

    scene.parcels.forEach((parcel) => {
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
          onCameraEnter: () => utils.setTimeout(Player.TRIGGER_INTERVAL, () => this.start()),
          onCameraExit: () => utils.setTimeout(Player.TRIGGER_INTERVAL, () => this.stop())
        })
      )

      engine.addEntity(box)

      this._parcels.push(parcel)
    })
  }

  private async start() {
    Logger.log('player start triggered')

    if (this.isPlaying()) {
      Logger.log('player start skipped - listener already connected to player')
      return
    } else if (!this.isActiveInScene()) {
      Logger.log('player start skipped - listener is not active in scene')
      return
    }

    Logger.log('player starting - connecting to stream', this._stream)

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

      Logger.log('player started successfully')

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
      Logger.log('player failed to start', e.message)
    }
  }

  private stop(force: boolean = false) {
    Logger.log('player stop triggered')

    if (!force && this.isPlaying() && this.isActiveInScene()) {
      Logger.log('player stop skipped - listener connected to player and is still active in scene')
      return
    }

    Logger.log('player stopping')

    if (this.hasComponent(AudioStream)) {
      this.removeComponent(AudioStream)
    }

    if (this.hasComponent(utils.Interval)) {
      this.removeComponent(utils.Interval)
    }

    Logger.log('player stopped successfully')
  }

  private async restart() {
    Logger.log('player restart triggered')

    this.stop(true)
    await this.start()

    Logger.log('player restarted successfully')
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
      await this.restart()
    }
  }
}
