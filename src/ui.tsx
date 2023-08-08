import * as utils from '@dcl-sdk/utils'
import { Color4 } from '@dcl/sdk/math'
import ReactEcs, { DisplayType, Label, UiBackgroundProps, UiEntity, UiTransformProps } from '@dcl/sdk/react-ecs'
import { TUiConfig } from './types/ui'

export class Ui {
    private socket?: WebSocket

    private static artist?: string

    private static title?: string

    private static started?: Date

    private static ends?: Date

    private static display: DisplayType = 'none'

    private heartbeatId?: number

    constructor(private path: string, private config: TUiConfig) { }

    connect(token: string, onError: () => void) {
        console.log('ui connecting')

        Ui.display = 'flex'

        this.socket = new WebSocket('wss://' + this.config.domain + '/socket/stream' + this.path)

        this.socket.onopen = (event: Event) => {
            console.log("WebSocket open:", event.type)

            this.heartbeatId = utils.timers.setInterval(() => this.heartbeat(token), 30000)
        }
        this.socket.onclose = (event: CloseEvent) => {
            console.log("WebSocket closed:", event.type, "code:", event.code, "reason:", event.reason)

            if (event.code === 1006) {
                onError()
            }
        }
        this.socket.onerror = (event: Event) => {
            console.log("WebSocket error:", event.type)

            onError()
        }
        this.socket.onmessage = (event) => {
            console.log("WebSocket message received:", event.type, "data:", event.data)

            const data = JSON.parse(event.data)

            Ui.artist = data.data.artist
            Ui.title = data.data.title
            Ui.started = new Date(data.data.started)
            Ui.ends = new Date(data.data.ends)
        }

        console.log('ui connection successful')
    }

    disconnect() {
        console.log('ui disconnecting')

        Ui.display = 'none'

        if (this.heartbeatId) {
            utils.timers.clearInterval(this.heartbeatId)

            delete this.heartbeatId
        }

        if (this.socket) {
            this.socket.close()

            delete this.socket
        }

        delete Ui.artist
        delete Ui.title
        delete Ui.started
        delete Ui.ends

        console.log('ui disconnection successful')
    }

    private heartbeat(token: string) {
        if (this.socket && this.socket.OPEN) {
            const event = JSON.stringify({
                event: 'heartbeat',
                data: { token }
            })

            console.log('ui heartbeat', event)

            this.socket.send(event)
        }
    }

    static canvas(): ReactEcs.JSX.Element {
        const uiTransform: UiTransformProps = {
            display: Ui.display,
            width: 300,
            height: 300,
            positionType: 'absolute',
            position: {
                bottom: '10px',
                right: '10px'
            },
            padding: 5,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
        }

        const uiBackground: UiBackgroundProps = {
            color: Color4.Gray()
        }

        return <UiEntity key={"chorus"} uiTransform={uiTransform} uiBackground={uiBackground}>
            <Ui.Player />
        </UiEntity>
    }

    private static Player(): ReactEcs.JSX.Element {
        if (!Ui.artist || !Ui.title || !Ui.started || !Ui.ends) {
            return <Ui.Label value={"Loading..."} />
        }

        const uiTransform: UiTransformProps = {
            flexDirection: 'column',
        }

        return <UiEntity uiTransform={uiTransform}>
            <Ui.Label value={"Chorus"} />
            <Ui.Label value={Ui.artist} />
            <Ui.Label value={Ui.title} />
            <Ui.Label value={Ui.started.toLocaleString()} />
            <Ui.Label value={Ui.ends.toLocaleString()} />
        </UiEntity>
    }

    private static Label(props: { value: string }): ReactEcs.JSX.Element {
        return <Label value={props.value} fontSize={18} uiTransform={{ width: '100%', height: 30 }} />
    }
}
