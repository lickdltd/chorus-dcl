import { TCommonDomain, TCommonProtocol, TCommonVersion } from './common'

export type TApiConfig = TCommonProtocol & TCommonDomain & TCommonVersion & {}
