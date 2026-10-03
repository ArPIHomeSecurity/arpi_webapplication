import { UntypedFormBuilder } from "@angular/forms"
import { ActivatedRoute, convertToParamMap } from "@angular/router"
import { of } from "rxjs"

import { Sensor, ZigbeeDevice } from "@app/models"
import { SensorDetailComponent } from "./sensor-detail.component"

describe("SensorDetailComponent IAS bindings", () => {
  let component: SensorDetailComponent
  const alarmKey = "1/a:0500:0002"
  const tamperKey = `${alarmKey}:tamper`
  const descriptor = {
    cluster: "ias_zone",
    clusterId: 0x0500,
    attribute: "zone_status",
    attributeId: 2,
    valueType: "ZoneStatus",
    sources: ["command:status_change_notification"]
  }
  const device: ZigbeeDevice = {
    id: 42,
    ieeeAddress: "00:11:22:33:44:55:66:77",
    availability: "online",
    zoneType: 0x0015,
    metadata: {
      capabilities: {
        [alarmKey]: { ...descriptor, field: "alarm" },
        [tamperKey]: { ...descriptor, field: "tamper" }
      }
    }
  }

  beforeEach(() => {
    component = new SensorDetailComponent(
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      new UntypedFormBuilder(),
      { paramMap: of(convertToParamMap({})) } as ActivatedRoute,
      null,
      null
    )
    component.channels = []
    component.zigbeeDevices = [device]
    component.sensor = Object.assign(new Sensor(), {
      id: 1,
      typeId: 3,
      zigbeeDeviceId: device.id,
      zigbeeEndpoint: "1",
      zigbeeCapability: "a:0500:0002:tamper",
      zoneId: 1,
      areaId: 1
    })
    component.updateForm(component.sensor)
  })

  it("offers independently selectable alarm and tamper capabilities", () => {
    expect(component.zigbeeCapabilityKeys).toEqual([alarmKey, tamperKey])
    expect(component.zigbeeCapabilityLabel(alarmKey)).toBe("IAS Zone / Alarm")
    expect(component.zigbeeCapabilityLabel(tamperKey)).toBe("IAS Zone / Tamper")
  })

  it("round-trips the tamper binding without changing the manual sensor type", () => {
    expect(component.sensorForm.controls.zigbeeCapabilityKey.value).toBe(tamperKey)
    const sensor = component.prepareSensor()
    expect(sensor.zigbeeEndpoint).toBe("1")
    expect(sensor.zigbeeCapability).toBe("a:0500:0002:tamper")
    expect(sensor.typeId).toBe(3)
  })

  it("preserves labels for old metadata and falls back for unknown capabilities", () => {
    component.zigbeeDevices = [
      { ...device, metadata: { capabilities: { [alarmKey]: descriptor } } }
    ]
    expect(component.zigbeeCapabilityLabel(alarmKey)).toBe("ias_zone / zone_status")
    expect(component.zigbeeCapabilityLabel("2/unknown")).toBe("2/unknown")
  })
})
