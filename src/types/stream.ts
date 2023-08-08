import { TCommonDomain, TCommonProtocol } from './common'

export type TStreamConfig = TCommonProtocol & TCommonDomain & {
    volume: number
}
