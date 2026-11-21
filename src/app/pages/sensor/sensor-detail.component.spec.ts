import { UntypedFormBuilder, Validators } from "@angular/forms"
import { ActivatedRoute, convertToParamMap } from "@angular/router"
import { of } from "rxjs"

import {
  ChannelTypes,
  Sensor,
  SensorContactTypes,
  SensorEOLCount,
  SensorType,
  ZigbeeDevice,
  ZigbeeEntity
} from "@app/models"
import { SensorDetailComponent } from "./sensor-detail.component"

describe("SensorDetailComponent Zigbee entity bindings", () => {
  let component: SensorDetailComponent
  const alarmEntity: ZigbeeEntity = {
    entityId: "binary_sensor/door_contact",
    uniqueId: "door_contact",
    platform: "binary_sensor",
    name: "Front Door",
    deviceClass: "opening"
  }
  const tamperEntity: ZigbeeEntity = {
    entityId: "binary_sensor/device_tamper",
    uniqueId: "device_tamper",
    platform: "binary_sensor",
    name: "Tamper",
    deviceClass: "tamper"
  }
  const device: ZigbeeDevice = {
    id: 42,
    ieeeAddress: "00:11:22:33:44:55:66:77",
    metadata: {
      entities: [alarmEntity, tamperEntity]
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
      zigbeeEntityId: tamperEntity.entityId,
      zoneId: 1,
      areaId: 1
    })
    component.updateForm(component.sensor)
  })

  it("offers binary sensor entities", () => {
    const nonBinaryEntity: ZigbeeEntity = {
      ...alarmEntity,
      entityId: "sensor/battery_level",
      platform: "sensor"
    }
    component.zigbeeDevices = [
      {
        ...device,
        metadata: { entities: [...(device.metadata?.entities ?? []), nonBinaryEntity] }
      }
    ]

    expect(component.zigbeeEntities).toEqual([alarmEntity, tamperEntity])
  })

  it("round-trips the selected entity binding", () => {
    expect(component.sensorForm.controls.zigbeeEntity.value).toBe(tamperEntity)
    const sensor = component.prepareSensor()
    expect(sensor.zigbeeDeviceId).toBe(device.id)
    expect(sensor.zigbeeEntityId).toBe(tamperEntity.entityId)
    expect(sensor.typeId).toBe(3)
  })

  it("requires an entity for Zigbee sensors", () => {
    const entityControl = component.sensorForm.controls.zigbeeEntity

    expect(entityControl.hasValidator(Validators.required)).toBeTrue()
    entityControl.setValue(null)
    expect(entityControl.invalid).toBeTrue()

    entityControl.setValue(tamperEntity)
    expect(entityControl.valid).toBeTrue()
  })

  it("keeps a device selectable while it has an unassigned entity", () => {
    component.sensors = [
      Object.assign(new Sensor(), {
        id: 2,
        zigbeeDeviceId: device.id,
        zigbeeEntityId: tamperEntity.entityId
      })
    ]

    expect(component.isZigbeeDeviceDisabled(device)).toBeFalse()

    component.sensors.push(
      Object.assign(new Sensor(), {
        id: 3,
        zigbeeDeviceId: device.id,
        zigbeeEntityId: alarmEntity.entityId
      })
    )
    expect(component.isZigbeeDeviceDisabled(device)).toBeTrue()
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
    expect(component.sensorForm.controls.zigbeeEntity.hasValidator(Validators.required)).toBeFalse()
  })

  it("allows switching to wired mode before a channel is selected", () => {
    component.channels = [{ channel: -1, sensor: null, sensorB: null }]

    expect(() => {
      component.sensorForm.controls.bindingMode.setValue("wired")
      component.onBindingModeChanged("wired")
    }).not.toThrow()
  })

  it("sets the sensor type from the selected entity device class", () => {
    const tamperType = { id: 7, name: "Tamper" } as SensorType
    component.sensorTypes = [tamperType]
    component.sensorForm.controls.zigbeeEntity.setValue(tamperEntity)

    component.onZigbeeEntityChanged()

    expect(component.sensorForm.controls.typeId.value).toBe(tamperType.id)
  })
})
