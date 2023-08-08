import { TCommonDomain, TCommonVersion } from './common'
import { TriggerAreaSpec } from '@dcl-sdk/utils/dist/trigger'

export type TPlayerConfig = TCommonDomain & TCommonVersion & {
    volume: number
    parcels: string[]
    areas: TriggerAreaSpec[]
    schedule?: TPlayerConfigSchedule
}

type TPlayerConfigSchedule = {
    start: Date
    end?: Date
}
