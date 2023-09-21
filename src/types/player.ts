import { TriggerAreaSpec } from '@dcl-sdk/utils/dist/trigger'
import { Color3 } from '@dcl/sdk/math'
import { TCommonDomain } from './common'

export type TPlayerConfig = TCommonDomain & {
    debugColor: Color3
    volume: number
    parcels: string[]
    areas: TriggerAreaSpec[]
    schedule?: TPlayerConfigSchedule
}

type TPlayerConfigSchedule = {
    start: Date
    end?: Date
}
