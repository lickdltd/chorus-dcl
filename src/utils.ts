import { TriggerAreaSpec } from '@dcl-sdk/utils/dist/trigger'
import { InputAction, PointerEventType, PointerLock, engine, inputSystem } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { getSceneInfo } from '~system/Scene'
import { TDomain, TProtocol } from './types/common'

export class Utils {
    static getProtocol(domain: TDomain): TProtocol {
        return domain === 'localhost' ? 'http' : 'https'
    }

    static getBaseUrl(protocol: TProtocol, domain: TDomain, path?: string): string {
        if (path) {
            return protocol + '://' + domain + path
        }

        return protocol + '://' + domain
    }

    static async getAreas(areas: TriggerAreaSpec[] = [], parcels: string[] = []): Promise<TriggerAreaSpec[]> {
        if (areas.length > 0) {
            console.log('using specified areas')
            return areas
        }

        const scene = JSON.parse((await getSceneInfo({})).metadata).scene
        const baseSplit: string[] = scene.base.split(',', 2)
        const baseOffset: Vector3 = Vector3.create(parseInt(baseSplit[0]), 0, parseInt(baseSplit[1]))

        console.log('no areas specified, defaulting to parcels for areas')
        if (parcels.length <= 0) {
            console.log('no parcels specified, defaulting to all parcels for areas')
            parcels = scene.parcels
        }

        const height: number = Math.round((Math.log(parcels.length + 1) / Math.log(2)) * 20)

        parcels.forEach(parcel => {
            const parcelSplit: string[] = parcel.split(',', 2)
            const x: number = (parseInt(parcelSplit[0]) - baseOffset.x) * 16 + 8
            const y: number = (parseInt(parcelSplit[1]) - baseOffset.z) * 16 + 8

            const position: Vector3 = Vector3.create(x, 0.0, y)
            const scale: Vector3 = Vector3.create(16, height, 16)

            areas.push({ type: 'box', position, scale })
        })

        return areas
    }

    static isMediaAllowed(): boolean {
        const isInputSystemTriggered = inputSystem.isTriggered(InputAction.IA_ANY, PointerEventType.PET_DOWN)
        const isPointerLocked = PointerLock.get(engine.CameraEntity).isPointerLocked

        console.log({ isInputSystemTriggered, isPointerLocked })

        return isInputSystemTriggered || isPointerLocked
    }
}
