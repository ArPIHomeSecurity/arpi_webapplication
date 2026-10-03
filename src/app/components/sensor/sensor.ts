import { Component, Input } from "@angular/core"
import { Sensor, SensorType, ZigbeeDevice } from "@app/models"

@Component({
  selector: "component-sensor",
  templateUrl: "sensor.html",
  styleUrls: ["sensor.scss"],
  providers: [],
  standalone: false
})
export class SensorComponent {
  readonly SensorType = SensorType

  @Input() sensor: Sensor
  @Input() delay: number = null
  @Input() sensorTypes: SensorType[]
  @Input() zigbeeDevices: Map<number, ZigbeeDevice>

  get zigbeeDevice(): ZigbeeDevice | undefined {
    return this.sensor?.zigbeeDeviceId != null
      ? this.zigbeeDevices?.get(this.sensor.zigbeeDeviceId)
      : undefined
  }

  getSensorTypeName(sensorTypeId: number) {
    if (this.sensorTypes?.length && sensorTypeId != null) {
      return this.sensorTypes.find(x => x.id === sensorTypeId).name
    }

    return ""
  }
}
