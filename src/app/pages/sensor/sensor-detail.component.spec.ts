import { UntypedFormBuilder, Validators } from "@angular/forms"
import { ActivatedRoute, convertToParamMap } from "@angular/router"
import { of } from "rxjs"

import {
  ChannelTypes,
  Sensor,
  SensorContactTypes,
  SensorEOLCount,
  ZigbeeDevice,
  ZigbeeSignal
} from "@app/models"
import { SensorDetailComponent } from "./sensor-detail.component"

describe("SensorDetailComponent IAS bindings", () => {
  let component: SensorDetailComponent
  const alarmSignal: ZigbeeSignal = {
    endpoint: "1",
    cluster: "ias_zone",
    clusterId: 0x0500,
    attribute: "zone_status",
    attributeId: 2,
    valueType: "ZoneStatus",
    sources: ["command:status_change_notification"],
    field: "alarm"
  }
  const tamperSignal: ZigbeeSignal = { ...alarmSignal, field: "tamper" }
  const device: ZigbeeDevice = {
    id: 42,
    ieeeAddress: "00:11:22:33:44:55:66:77",
    availability: "online",
    metadata: {
      signals: [alarmSignal, tamperSignal]
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
      zigbeeClusterId: 0x0500,
      zigbeeAttributeId: 2,
      zigbeeField: "tamper",
      zoneId: 1,
      areaId: 1
    })
    component.updateForm(component.sensor)
  })

  it("offers independently selectable alarm and tamper signals", () => {
    expect(component.zigbeeSignals).toEqual([alarmSignal, tamperSignal])
    expect(component.zigbeeSignalLabel(alarmSignal)).toBe("IAS Zone / Alarm")
    expect(component.zigbeeSignalLabel(tamperSignal)).toBe("IAS Zone / Tamper")
  })

  it("round-trips the tamper binding without changing the manual sensor type", () => {
    expect(component.sensorForm.controls.zigbeeSignal.value).toBe(tamperSignal)
    const sensor = component.prepareSensor()
    expect(sensor.zigbeeEndpoint).toBe("1")
    expect(sensor.zigbeeClusterId).toBe(0x0500)
    expect(sensor.zigbeeAttributeId).toBe(2)
    expect(sensor.zigbeeField).toBe("tamper")
    expect(sensor.typeId).toBe(3)
  })

  it("does not require or send wired settings in Zigbee mode", () => {
    component.boardVersion = 3
    Object.assign(component.sensor, {
      channelType: ChannelTypes.NORMAL,
      sensorContactType: SensorContactTypes.NC,
      sensorEolCount: SensorEOLCount.DOUBLE
    })
    component.updateForm(component.sensor)

    expect(component.sensorForm.controls.bindingMode.value).toBe("zigbee")
    expect(component.sensorForm.controls.channelType.hasValidator(Validators.required)).toBeFalse()
    expect(
      component.sensorForm.controls.sensorContactType.hasValidator(Validators.required)
    ).toBeFalse()
    expect(component.sensorForm.controls.eolCount.hasValidator(Validators.required)).toBeFalse()
    expect(component.sensorForm.controls.eolCount.enabled).toBeTrue()

    const sensor = component.prepareSensor()
    expect(sensor.channelType).toBeNull()
    expect(sensor.sensorContactType).toBeNull()
    expect(sensor.sensorEolCount).toBeNull()
  })

  it("requires a signal for Zigbee sensors", () => {
    const signalControl = component.sensorForm.controls.zigbeeSignal

    expect(signalControl.hasValidator(Validators.required)).toBeTrue()
    signalControl.setValue(null)
    expect(signalControl.invalid).toBeTrue()

    signalControl.setValue(tamperSignal)
    expect(signalControl.valid).toBeTrue()
  })

  it("restores wired-setting validation when switching back to wired mode", () => {
    component.boardVersion = 3
    Object.assign(component.sensor, {
      channel: 1,
      channelType: ChannelTypes.NORMAL,
      sensorContactType: SensorContactTypes.NC,
      sensorEolCount: SensorEOLCount.SINGLE
    })
    component.channels = [{ channel: 1, sensor: null, sensorB: null }]
    component.updateForm(component.sensor)

    component.sensorForm.controls.bindingMode.setValue("wired")
    component.onBindingModeChanged("wired")

    expect(component.sensorForm.controls.channelType.hasValidator(Validators.required)).toBeTrue()
    expect(
      component.sensorForm.controls.sensorContactType.hasValidator(Validators.required)
    ).toBeTrue()
    expect(component.sensorForm.controls.eolCount.hasValidator(Validators.required)).toBeTrue()
    expect(component.sensorForm.controls.zigbeeSignal.hasValidator(Validators.required)).toBeFalse()
  })

  it("allows switching to wired mode before a channel is selected", () => {
    component.channels = [{ channel: -1, sensor: null, sensorB: null }]

    expect(() => {
      component.sensorForm.controls.bindingMode.setValue("wired")
      component.onBindingModeChanged("wired")
    }).not.toThrow()
  })

  it("labels ordinary structured signals from their cluster and attribute", () => {
    const ordinarySignal: ZigbeeSignal = {
      endpoint: "2",
      cluster: "occupancy_sensing",
      clusterId: 0x0406,
      attribute: "occupancy",
      attributeId: 0,
      valueType: "Occupancy",
      sources: ["attribute"]
    }
    component.zigbeeDevices = [{ ...device, metadata: { signals: [ordinarySignal] } }]
    expect(component.zigbeeSignalLabel(ordinarySignal)).toBe("occupancy_sensing / occupancy")
  })
})
