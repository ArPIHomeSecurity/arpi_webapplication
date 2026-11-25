import { HttpClient } from "@angular/common/http"
import { Injectable } from "@angular/core"
import { Observable } from "rxjs"

import { ZigbeeDevice } from "@app/models"

@Injectable()
export class ZigbeeService {
  constructor(private http: HttpClient) {}

  getDevices(): Observable<ZigbeeDevice[]> {
    return this.http.get<ZigbeeDevice[]>("/api/zigbee-devices/")
  }

  getDevice(deviceId: number): Observable<ZigbeeDevice> {
    return this.http.get<ZigbeeDevice>("/api/zigbee-device/" + deviceId)
  }

  updateDevice(device: Partial<ZigbeeDevice> & { id: number }): Observable<ZigbeeDevice> {
    return this.http.put<ZigbeeDevice>("/api/zigbee-device/" + device.id, device)
  }

  deleteDevice(deviceId: number): Observable<boolean> {
    return this.http.delete<boolean>("/api/zigbee-device/" + deviceId)
  }

  pair(): Observable<any> {
    return this.http.put("/api/zigbee/pairing", null)
  }
}
