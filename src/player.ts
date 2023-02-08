import { getParcel, SceneParcels } from '@decentraland/ParcelIdentity'
import { FlatFetchResponse, signedFetch } from '@decentraland/SignedFetch'
import * as utils from '@dcl/ecs-scene-utils'
import { Logger } from './logger'

interface PlayerConfig {
  url?: string
  volume?: number
  parcels?: string[]
  zones?: Transform[]
  schedule?: PlayerConfigSchedule
  debug?: boolean
}

interface PlayerConfigSchedule {
  start: Date
}

/**
 * Chorus player
 * @beta
 */
export class Player extends Entity {
  private readonly _stream: string

  private readonly _url: string

  private readonly _volume: number

  private readonly _parcels: string[]

  private readonly _zones: Transform[]

  private readonly _schedule: PlayerConfigSchedule

  private readonly _debug: boolean

  private _triggers: Transform[] = []

  private _connected: boolean = false

  private _token: string

  private static URL_DEFAULT: string = 'https://chorus.lickd.co'

  private static ACTIVATE_INTERVAL: number = 100

  private static SCHEDULE_INTERVAL: number = 60000

  private static IS_USER_ACTIVE_INTERVAL: number = 10

  private static HEARTBEAT_INTERVAL: number = 60000

  public constructor(stream: string, config: PlayerConfig = {}) {
    Logger.log('initialising')

    super()

    engine.addEntity(this)

    this._stream = stream

    this._url = config.url ?? Player.URL_DEFAULT
    this._volume = config.volume ?? 1.0
    this._parcels = config.parcels ?? []
    this._zones = config.zones ?? []
    this._schedule = config.schedule
    this._debug = config.debug ?? false

    this.activate()
      .then(() => Logger.log('initialised successfully'))
      .catch(() => Logger.log('initialisation failed'))
  }

  public setVolume(volume: number): void {
    if (!this.isConnected()) {
      Logger.log('set volume skipped - not connected')
      return
    }

    if (volume <= 0.0) {
      volume = 0.01
    } else if (volume >= 1.0) {
      volume = 1.0
    }

    Logger.log('setting volume to', volume)

    this.getComponent(AudioStream).volume = volume
  }

  private async activate(): Promise<boolean> {
    return new Promise(async (resolve) => {
      if (!this.isCameraActive()) {
        Logger.log('activation waiting - no camera activity yet')
        utils.setTimeout(Player.ACTIVATE_INTERVAL, () => resolve(this.activate()))
        return
      }

      Logger.log('activating')

      if (this._zones.length > 0) {
        this.activateZones()
      } else {
        await this.activateParcels()
      }

      Logger.log('activation successful')

      resolve(true)
    })
  }

  private activateZones(): void {
    Logger.log('activate zones')

    this._zones.forEach((zone) => {
      Logger.log('activating zone', zone)
      this.createTrigger(zone)
    })
  }

  private async activateParcels(): Promise<void> {
    Logger.log('activate parcels')

    const scene: SceneParcels = (await getParcel()).land.sceneJsonData.scene
    const parcels: string[] = this._parcels.length > 0 ? this._parcels : scene.parcels

    const baseSplit: string[] = scene.base.split(',', 2)
    const baseOffset: Vector3 = new Vector3(parseInt(baseSplit[0]), 0, parseInt(baseSplit[1]))
    const height: number = Math.round((Math.log(parcels.length + 1) / Math.log(2)) * 20)

    parcels.forEach((parcel) => {
      Logger.log('activating parcel', parcel)

      const parcelSplit: string[] = parcel.split(',', 2)

      const x: number = (parseInt(parcelSplit[0]) - baseOffset.x) * 16 + 8
      const y: number = (parseInt(parcelSplit[1]) - baseOffset.z) * 16 + 8

      const position: Vector3 = new Vector3(x, 0.0, y)
      const scale: Vector3 = new Vector3(16, height, 16)

      this.createTrigger(new Transform({ position, scale }))
    })
  }

  private createTrigger(zone: Transform): void {
    Logger.log('create trigger', zone)

    const playerEntity: Entity = new Entity()

    playerEntity.addComponent(
      new utils.TriggerComponent(new utils.TriggerBoxShape(zone.scale, zone.position), {
        onCameraEnter: () => this.connect(),
        onCameraExit: () => this.disconnect(),
        enableDebug: this._debug
      })
    )

    engine.addEntity(playerEntity)

    this._triggers.push(zone)
  }

  private async connect(): Promise<void> {
    if (this.isConnected()) {
      Logger.log('connect skipped - already connected')
      return
    }

    if (!(await this.isUserActive())) {
      Logger.log('connect skipped - user not active')
      return
    }

    if (this._schedule?.start instanceof Date && this._schedule.start > new Date()) {
      Logger.log('connect waiting - schedule start active', this._schedule.start.toISOString())
      utils.setTimeout(Player.SCHEDULE_INTERVAL, () => this.connect())
      return
    }

    Logger.log('connecting to stream', this._stream)

    this._connected = true

    try {
      this._token = await this.signIn(this._stream)

      if (!this._connected) {
        Logger.log('connection discarded - user has disconnected while retrieving token')
        this.reset()
        return
      }

      this.addComponentOrReplace(new AudioStream(this._url + this._stream + '?token=' + this._token))
      this.getComponent(AudioStream).volume = this._volume

      this.addComponentOrReplace(new utils.Interval(Player.HEARTBEAT_INTERVAL, () => this.heartbeat(this._token)))

      if (!this._connected) {
        Logger.log('connection stream discarded - user has disconnected while connecting')
        this.reset()
        return
      }

      Logger.log('connected successfully')
    } catch (e) {
      Logger.log('connection failed', e.message)
    }
  }

  private async signIn(stream: string): Promise<string> {
    const response: FlatFetchResponse = await signedFetch(this._url + '/api/listener/sign-in/dcl', {
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify({ stream })
    })

    if (!response.ok) {
      throw new Error('session could not be created')
    }

    const json: any = await JSON.parse(response.text || '{}')

    if (!json.token) {
      throw new Error('session token not found')
    }

    return json.token
  }

  private async heartbeat(token: string): Promise<void> {
    Logger.log('heartbeat')

    try {
      await this.heartbeatPulse(token)

      Logger.log('heartbeat successful')
    } catch (e) {
      Logger.log('heartbeat failed', e.message)

      this.reset()
      await this.connect()
    }
  }

  private async heartbeatPulse(token: string): Promise<void> {
    const response: FlatFetchResponse = await signedFetch(this._url + '/api/listener/heartbeat/dcl', {
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      body: JSON.stringify({ token })
    })

    if (response.status === 404) {
      throw new Error('heartbeat not found')
    }

    if (!response.ok) {
      throw new Error('unknown error')
    }
  }

  private async disconnect(): Promise<void> {
    if (this.isConnected() && (await this.isUserActive())) {
      Logger.log('disconnect skipped - connected and user still active (and not forced)')
      return
    }

    Logger.log('disconnecting from', this._stream)

    this.reset()

    Logger.log('disconnected successfully')
  }

  private reset(): void {
    Logger.log('resetting player')

    this._connected = false

    if (this.hasComponent(AudioStream)) {
      this.removeComponent(AudioStream)
    }

    if (this.hasComponent(utils.Interval)) {
      this.removeComponent(utils.Interval)
    }

    this.signOut()

    Logger.log('resetting player successful')
  }

  private signOut(): void {
    if (this._token !== undefined) {
      signedFetch(this._url + '/api/listener/sign-out/dcl', {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify({ token: this._token })
      }).catch((e) => Logger.log('sign out failed', e))
    }

    this._token = undefined
  }

  private isCameraActive(): boolean {
    const x: number = Camera.instance.position.x !== 0 ? Camera.instance.position.x : -1
    const y: number = Camera.instance.position.y !== 0 ? Camera.instance.position.y : -1
    const z: number = Camera.instance.position.z !== 0 ? Camera.instance.position.z : -1

    return x >= 0 || y >= 0 || z >= 0
  }

  private isUserActive(attempts: number = 1): Promise<boolean> {
    return new Promise((resolve) => {
      const active = this.isUserActiveInTriggers()
      if (!active && attempts < 3) {
        utils.setTimeout(Player.IS_USER_ACTIVE_INTERVAL, () => resolve(this.isUserActive(attempts + 1)))
        return
      }

      resolve(active)
    })
  }

  private isUserActiveInTriggers(): boolean {
    const x: number = Math.round(Camera.instance.feetPosition.x * 100) / 100
    const y: number = Math.round(Camera.instance.feetPosition.y * 100) / 100
    const z: number = Math.round(Camera.instance.feetPosition.z * 100) / 100

    let active = false

    this._triggers.forEach((trigger) => {
      const triggerXMin: number = trigger.position.x - trigger.scale.x / 2
      const triggerXMax: number = trigger.position.x + trigger.scale.x / 2

      const triggerYMin: number = trigger.position.y - trigger.scale.y / 2
      const triggerYMax: number = trigger.position.y + trigger.scale.y / 2

      const triggerZMin: number = trigger.position.z - trigger.scale.z / 2
      const triggerZMax: number = trigger.position.z + trigger.scale.z / 2

      const insideX: boolean = x >= triggerXMin && x <= triggerXMax
      const insideY: boolean = y >= triggerYMin && y <= triggerYMax
      const insideZ: boolean = z >= triggerZMin && z <= triggerZMax

      if (insideX && insideY && insideZ) {
        active = true
        return
      }
    })

    return active
  }

  private isConnected(): boolean {
    return this.hasComponent(AudioStream)
  }
}
