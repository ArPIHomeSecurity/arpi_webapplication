import { CdkDragDrop } from "@angular/cdk/drag-drop"
import { NO_ERRORS_SCHEMA } from "@angular/core"
import { ComponentFixture, TestBed } from "@angular/core/testing"
import { MatButtonModule } from "@angular/material/button"
import { MatIconModule } from "@angular/material/icon"
import { By } from "@angular/platform-browser"
import { Router, RouterLink, RouterModule } from "@angular/router"
import { EMPTY, of } from "rxjs"

import { MONITORING_STATE, Sensor, SensorType, Zone } from "@app/models"
import { AUTHENTICATION_SERVICE } from "@app/tokens"
import { ZoneListComponent } from "./zone-list.component"

describe("ZoneListComponent", () => {
  let fixture: ComponentFixture<ZoneListComponent>
  let role: string
  let monitoringState: MONITORING_STATE
  let updatedSensors: Sensor[]

  const sensor = Object.assign(new Sensor(), {
    id: 17,
    name: "Front door",
    typeId: 1,
    zoneId: 3
  })
  const zone = Object.assign(new Zone(), {
    id: 3,
    name: "Entry",
    uiOrder: 0,
    awayArmDelay: null,
    awayAlertDelay: null,
    stayArmDelay: null,
    stayAlertDelay: null,
    disarmedDelay: null
  })
  const destinationZone = Object.assign(new Zone(), {
    id: 4,
    name: "Living room",
    uiOrder: 1
  })

  beforeEach(async () => {
    role = "user"
    monitoringState = MONITORING_STATE.READY
    updatedSensors = []

    await TestBed.configureTestingModule({
      declarations: [ZoneListComponent],
      imports: [MatButtonModule, MatIconModule, RouterModule.forRoot([])],
      providers: [
        {
          provide: AUTHENTICATION_SERVICE,
          useValue: { getRole: () => role }
        },
        {
          provide: "EventService",
          useValue: {
            isConnected: () => of(true),
            listen: () => EMPTY
          }
        },
        {
          provide: "LoaderService",
          useValue: {
            display: () => {},
            disable: () => {},
            clearMessage: () => {},
            setMessage: () => {}
          }
        },
        {
          provide: "MonitoringService",
          useValue: { getMonitoringState: () => of(monitoringState) }
        },
        {
          provide: "SensorService",
          useValue: {
            getSensors: () => of([sensor]),
            getSensorTypes: () => of([{ id: 1, name: "Open" } as SensorType]),
            updateSensor: (updated: Sensor) => {
              updatedSensors.push(updated)
              return of(updated)
            }
          }
        },
        {
          provide: "ZoneService",
          useValue: { getZones: () => of([zone, destinationZone]) }
        },
        { provide: "MatDialog", useValue: {} },
        { provide: "MatSnackBar", useValue: {} }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
  })

  it("shows a sensor view action to regular users", () => {
    fixture = TestBed.createComponent(ZoneListComponent)
    fixture.detectChanges()

    const actions = fixture.debugElement.query(By.css(".sensor-actions"))
    const buttons = actions.queryAll(By.css("button"))
    const viewLink = buttons[0].injector.get(RouterLink)

    expect(fixture.nativeElement.textContent).toContain("Front door")
    expect(buttons.length).toBe(1)
    expect(buttons[0].nativeElement.getAttribute("aria-label")).toBe("View sensor")
    expect(TestBed.inject(Router).serializeUrl(viewLink.urlTree)).toBe(`/sensors/${sensor.id}`)
    expect(fixture.debugElement.query(By.css(".sensor-drag-handle"))).toBeNull()

    const dropEvent = { item: { data: sensor } } as CdkDragDrop<Sensor[], Sensor[]>
    fixture.componentInstance.onSensorDrop(dropEvent, destinationZone.id)

    expect(updatedSensors).toEqual([])
  })

  it("shows view and edit actions to admins", () => {
    role = "admin"
    fixture = TestBed.createComponent(ZoneListComponent)
    fixture.detectChanges()

    const actions = fixture.debugElement.query(By.css(".sensor-actions"))
    const buttons = actions.queryAll(By.css("button"))
    const router = TestBed.inject(Router)
    const links = buttons.map(button => button.injector.get(RouterLink))

    expect(buttons.length).toBe(2)
    expect(links.map(link => router.serializeUrl(link.urlTree))).toEqual([
      `/sensors/${sensor.id}`,
      `/sensor/${sensor.id}`
    ])
    expect(fixture.debugElement.query(By.css(".sensor-drag-handle"))).not.toBeNull()
  })

  it("updates the sensor zone when an admin drops it in another zone", () => {
    role = "admin"
    localStorage.removeItem(`sensorOpened_${destinationZone.id}`)
    fixture = TestBed.createComponent(ZoneListComponent)
    fixture.detectChanges()

    const component = fixture.componentInstance
    const dropEvent = { item: { data: sensor } } as CdkDragDrop<Sensor[], Sensor[]>
    component.onOpenSensor(zone.id)

    component.onSensorDrop(dropEvent, destinationZone.id)

    expect(updatedSensors).toEqual([{ ...sensor, zoneId: destinationZone.id }])
    expect(component.getSensors(destinationZone.id)).toEqual([
      { ...sensor, zoneId: destinationZone.id }
    ])
    expect(component.sensorOpened[destinationZone.id]).toBeTrue()
    expect(localStorage.getItem(`sensorOpened_${destinationZone.id}`)).toBe("true")
    expect(component.sensorOpened[zone.id]).toBeFalse()
    expect(localStorage.getItem(`sensorOpened_${zone.id}`)).toBe("false")
    expect(
      fixture.nativeElement.querySelector(`#zone-sensors-header-${destinationZone.id}`)
    ).not.toBeNull()
  })

  it("does not update a sensor when monitoring is not READY", () => {
    role = "admin"
    monitoringState = MONITORING_STATE.INVALID_CONFIG
    fixture = TestBed.createComponent(ZoneListComponent)
    fixture.detectChanges()

    const dropEvent = { item: { data: sensor } } as CdkDragDrop<Sensor[], Sensor[]>
    fixture.componentInstance.onSensorDrop(dropEvent, destinationZone.id)

    expect(updatedSensors).toEqual([])
  })
})
