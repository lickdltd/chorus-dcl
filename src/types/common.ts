export type TProtocol = 'http' | 'https'
export type TDomain = 'chorus.lickd.co' | 'chorus.test.lickd.io' | 'localhost'

export type TCommonProtocol = {
    protocol: TProtocol
}

export type TCommonDomain = {
    domain: TDomain
}

export type TCommonVersion = {
    version: string
}
