import * as utils from '@dcl-sdk/utils'
import { Entity, Transform, engine } from '@dcl/sdk/ecs'
import ReactEcs from '@dcl/sdk/react-ecs'
import { version } from '../package.json'
import { Api } from './api'
import { Stream } from './stream'
import { TPlayerConfig } from './types/player'
import { Ui } from './ui'
import { Utils } from './utils'

export class Player {
    private config: TPlayerConfig

    private entity: Entity

    private api: Api

    private ui: Ui

    private stream: Stream

    private token?: string

    constructor(private path: string, config?: Partial<TPlayerConfig>) {
        console.log('initialising')

        this.config = {
            domain: 'chorus.lickd.co',
            volume: 1.0,
            parcels: [],
            areas: [],
            ...config,
            version
        }

        console.log(this.config)

        this.entity = engine.addEntity()

        this.api = new Api({
            protocol: Utils.getProtocol(this.config.domain),
            domain: this.config.domain,
            version: this.config.version
        })

        this.ui = new Ui(path, {
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

    public static uiComponent(): ReactEcs.JSX.Element {
        return Ui.canvas()
    }

    private async activate() {
        Transform.create(this.entity)

        const areas = await Utils.getAreas(this.config.areas, this.config.parcels)
        const onEnter = () => this.connect()
        const onExit = () => this.disconnect()

        utils.triggers.addTrigger(this.entity, utils.NO_LAYERS, utils.ALL_LAYERS, areas, onEnter, onExit)
    }

    private async connect() {
        console.log('connecting')

        try {
            this.token = await this.api.signIn(this.path)

            this.ui.connect(this.token, () => this.reconnect())
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

        this.ui.disconnect()
        this.stream.disconnect()

        console.log('disconnection successful')
    }

    private reconnect() {
        console.log('reconnecting')

        this.disconnect()
        this.connect()
    }
}
