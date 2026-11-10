import { NO_ERRORS_SCHEMA } from "@angular/core"
import { ComponentFixture, TestBed } from "@angular/core/testing"
import { MatDialog } from "@angular/material/dialog"
import { MatSnackBar } from "@angular/material/snack-bar"

import { Sensor, ZigbeeDevice } from "@app/models"
import { AUTHENTICATION_SERVICE } from "@app/tokens"
import { ZigbeeListComponent } from "./zigbee-list.component"

describe("ZigbeeListComponent linked sensors", () => {
  let component: ZigbeeListComponent
  let fixture: ComponentFixture<ZigbeeListComponent>

  const device: ZigbeeDevice = {
    id: 42,
    ieeeAddress: "00:11:22:33:44:55:66:77",
    sensorCount: 1
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ZigbeeListComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: AUTHENTICATION_SERVICE, useValue: {} },
        { provide: "EventService", useValue: {} },
        { provide: "LoaderService", useValue: {} },
        { provide: "MonitoringService", useValue: {} },
        { provide: "ZigbeeService", useValue: {} },
        { provide: "SensorService", useValue: {} },
        { provide: MatDialog, useValue: {} },
        { provide: MatSnackBar, useValue: {} }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(ZigbeeListComponent)
    component = fixture.componentInstance
    component.sensors = []
  })

  it("includes linked sensor names without count or signal", () => {
    const sensor = Object.assign(new Sensor(), {
      id: 7,
      name: "Front door",
      zigbeeDeviceId: device.id
    })
    component.sensors = [sensor]

    const sensorsAttribute = component
      .getDeviceAttributes(device)
      .find(attribute => attribute.label === "Sensors")

    expect(sensorsAttribute?.linkedSensors).toEqual([sensor])
    expect(sensorsAttribute?.values).toEqual([])
  })

  it("reports no sensors when the device has no linked sensors", () => {
    const sensorsAttribute = component
      .getDeviceAttributes({ ...device, sensorCount: 0 })
      .find(attribute => attribute.label === "Sensors")

    expect(sensorsAttribute?.linkedSensors).toEqual([])
    expect(sensorsAttribute?.values).toEqual(["None"])
  })
})
