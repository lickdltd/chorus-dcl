import * as utils from '@dcl-sdk/utils'
import { Entity, PointerLock, Transform, engine } from '@dcl/sdk/ecs'
import { Color3 } from '@dcl/sdk/math'
import { Api } from './api'
import { Stream } from './stream'
import { TPlayerConfig } from './types/player'
import { Utils } from './utils'

export class Player {
    private config: TPlayerConfig

    private entity: Entity

    private api: Api

    private stream: Stream

    private token?: string

    private userActive: boolean = false

    constructor(private path: string, config?: Partial<TPlayerConfig>) {
        console.log('initialising')

        this.config = {
            debugColor: Color3.Magenta(),
            domain: 'chorus.lickd.co',
            volume: 1.0,
            parcels: [],
            areas: [],
            ...config
        }

        console.log(this.config)

        this.entity = engine.addEntity()

        this.api = new Api({
            protocol: Utils.getProtocol(this.config.domain),
            domain: this.config.domain
        })

        this.stream = new Stream(path, this.entity, this.api, {
            protocol: Utils.getProtocol(this.config.domain),
            domain: this.config.domain,
            volume: this.config.volume
        })

        this.activate()
            .then(() => console.log('initialised successfully'))
            .catch(() => console.log('initialisation failed'))
    }

    private async activate() {
        Transform.create(this.entity)

        const areas = await Utils.getAreas(this.config.areas, this.config.parcels)
        const onEnter = () => {
            this.userActive = true
            this.connect()
        }
        const onExit = () => {
            this.userActive = false
            this.disconnect()
        }

        utils.triggers.addTrigger(this.entity, utils.NO_LAYERS, utils.ALL_LAYERS, areas, onEnter, onExit, this.config.debugColor)
    }

    private async connect() {
        if (!this.userActive) {
            console.log('connection cancelled - user is no longer active')
            return
        }

        if (!PointerLock.get(engine.CameraEntity).isPointerLocked) {
            console.log('connection waiting - media not allowed yet')
            utils.timers.setTimeout(() => this.connect(), 1000)
            return
        }

        console.log('connecting')

        try {
            this.token = await this.api.signIn(this.path)

            this.stream.connect(this.token, () => this.reconnect())

            console.log('connection successful')
        } catch (e) {
            console.error('connection failed')
            console.error(e)
        }
    }

    private disconnect() {
        console.log('disconnecting')

        if (this.token) {
            this.api.signOut(this.token)

            delete this.token
        }

        this.stream.disconnect()

        console.log('disconnection successful')
    }

    private reconnect() {
        console.log('reconnecting')

        this.disconnect()
        this.connect()
    }
}
