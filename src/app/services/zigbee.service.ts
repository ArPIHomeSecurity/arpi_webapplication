import { ZigbeeDevice } from "@app/models"
import { Observable } from "rxjs"

export interface ZigbeeService {
  getDevices(): Observable<ZigbeeDevice[]>
  getDevice(deviceId: number): Observable<ZigbeeDevice>
  updateDevice(device: Partial<ZigbeeDevice> & { id: number }): Observable<ZigbeeDevice>
  deleteDevice(deviceId: number): Observable<boolean>
  pair(): Observable<any>
}
