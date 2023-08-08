import { FlatFetchResponse, signedFetch } from '~system/SignedFetch'
import { TApiConfig } from './types/api'
import { Utils } from './utils'

export class Api {
    constructor(private config: TApiConfig) { }

    async signIn(stream: string): Promise<string> {
        const response = await this.post('/listener/sign-in/dcl', { stream })
        if (!response.ok) {
            throw new Error('session could not be created')
        }

        const json = await JSON.parse(response.body || '{}')
        if (!json.token) {
            throw new Error('session token not found')
        }

        return json.token
    }

    async signOut(token: string): Promise<void> {
        await this.post('/listener/sign-out/dcl', { token })
    }

    async heartbeat(token: string): Promise<void> {
        const response = await this.post('/listener/heartbeat/dcl', { token })
        if (response.status === 404) {
            throw new Error('heartbeat not found')
        }
        if (!response.ok) {
            throw new Error('unknown error')
        }
    }

    private async post(endpoint: string, body?: any): Promise<FlatFetchResponse> {
        const baseUrl = Utils.getBaseUrl(this.config.protocol, this.config.domain, '/api')
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'chorus-dcl/' + this.config.version
        }

        console.log('making api post request', { baseUrl, endpoint, headers, body })

        return signedFetch({
            url: baseUrl + endpoint,
            init: {
                headers,
                method: 'POST',
                body: JSON.stringify(body)
            }
        })
    }
}
