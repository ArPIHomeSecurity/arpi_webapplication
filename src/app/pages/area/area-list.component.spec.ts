import { CdkDragDrop } from "@angular/cdk/drag-drop"
import { NO_ERRORS_SCHEMA } from "@angular/core"
import { ComponentFixture, TestBed } from "@angular/core/testing"
import { MatButtonModule } from "@angular/material/button"
import { MatDialog } from "@angular/material/dialog"
import { MatIconModule } from "@angular/material/icon"
import { MatSnackBar } from "@angular/material/snack-bar"
import { By } from "@angular/platform-browser"
import { Router, RouterLink, RouterModule } from "@angular/router"
import { EMPTY, of, throwError } from "rxjs"

import { Area, MONITORING_STATE, Output, Sensor, SensorType } from "@app/models"
import { AUTHENTICATION_SERVICE } from "@app/tokens"
import { AreaListComponent } from "./area-list.component"

describe("AreaListComponent", () => {
  let fixture: ComponentFixture<AreaListComponent>
  let role: string
  let monitoringState: MONITORING_STATE
  let updatedSensors: Sensor[]
  let configuredAreas: Area[]
  let updateFails: boolean
  let snackbarMessages: string[]

  const sensor = Object.assign(new Sensor(), {
    id: 17,
    name: "Front door",
    typeId: 1,
    areaId: 3,
    zoneId: 9
  })
  const area = Object.assign(new Area(), { id: 3, name: "Ground floor", uiOrder: 0 })
  const destinationArea = Object.assign(new Area(), { id: 4, name: "Upper floor", uiOrder: 1 })

  beforeEach(async () => {
    role = "user"
    monitoringState = MONITORING_STATE.READY
    updatedSensors = []
    configuredAreas = [area, destinationArea]
    updateFails = false
    snackbarMessages = []

    await TestBed.configureTestingModule({
      declarations: [AreaListComponent],
      imports: [MatButtonModule, MatIconModule, RouterModule.forRoot([])],
      providers: [
        { provide: "AreaService", useValue: { getAreas: () => of(configuredAreas) } },
        { provide: AUTHENTICATION_SERVICE, useValue: { getRole: () => role } },
        {
          provide: "EventService",
          useValue: { isConnected: () => of(true), listen: () => EMPTY }
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
          provide: "OutputService",
          useValue: { getOutputs: () => of([] as Output[]) }
        },
        {
          provide: "SensorService",
          useValue: {
            getSensors: () => of([sensor]),
            getSensorTypes: () => of([{ id: 1, name: "Open" } as SensorType]),
            updateSensor: (updated: Sensor) => {
              if (updateFails) {
                return throwError(() => new Error("update failed"))
              }
              updatedSensors.push(updated)
              return of(updated)
            }
          }
        },
        { provide: MatDialog, useValue: {} },
        { provide: MatSnackBar, useValue: { open: message => snackbarMessages.push(message) } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()
  })

  it("shows sensor view actions to regular users without a drag handle", () => {
    fixture = TestBed.createComponent(AreaListComponent)
    fixture.detectChanges()

    const actions = fixture.debugElement.query(By.css(".sensor-actions"))
    const buttons = actions.queryAll(By.css("button"))
    const viewLink = buttons[0].injector.get(RouterLink)

    expect(fixture.nativeElement.textContent).toContain("Front door")
    expect(buttons.length).toBe(1)
    expect(TestBed.inject(Router).serializeUrl(viewLink.urlTree)).toBe(`/sensors/${sensor.id}`)
    expect(fixture.debugElement.query(By.css(".sensor-drag-handle"))).toBeNull()
  })

  it("disables sensor dragging when there is only one area", () => {
    role = "admin"
    configuredAreas = [area]
    fixture = TestBed.createComponent(AreaListComponent)
    fixture.detectChanges()

    const dragHandle = fixture.nativeElement.querySelector(".sensor-drag-handle")

    expect(dragHandle.disabled).toBeTrue()
  })

  it("moves a sensor to another area and updates source and destination panels", () => {
    role = "admin"
    fixture = TestBed.createComponent(AreaListComponent)
    fixture.detectChanges()

    const component = fixture.componentInstance
    component.onOpenSensorList(area.id)
    const dropEvent = { item: { data: sensor } } as CdkDragDrop<Sensor[], Sensor[]>

    component.onSensorDrop(dropEvent, destinationArea.id)

    expect(updatedSensors).toEqual([{ ...sensor, areaId: destinationArea.id }])
    expect(updatedSensors[0].zoneId).toBe(sensor.zoneId)
    expect(component.getSensors(destinationArea.id)).toEqual([
      { ...sensor, areaId: destinationArea.id }
    ])
    expect(component.sensorListOpened[area.id]).toBeFalse()
    expect(component.sensorListOpened[destinationArea.id]).toBeTrue()
    expect(
      fixture.nativeElement.querySelector(`#area-sensors-header-${destinationArea.id}`)
    ).not.toBeNull()
  })

  it("does not move sensors for non-admins", () => {
    fixture = TestBed.createComponent(AreaListComponent)
    fixture.detectChanges()

    const dropEvent = { item: { data: sensor } } as CdkDragDrop<Sensor[], Sensor[]>
    fixture.componentInstance.onSensorDrop(dropEvent, destinationArea.id)
    expect(updatedSensors).toEqual([])
  })

  it("does not move sensors when monitoring is not READY", () => {
    role = "admin"
    monitoringState = MONITORING_STATE.INVALID_CONFIG
    fixture = TestBed.createComponent(AreaListComponent)
    fixture.detectChanges()
    const dropEvent = { item: { data: sensor } } as CdkDragDrop<Sensor[], Sensor[]>
    fixture.componentInstance.onSensorDrop(dropEvent, destinationArea.id)

    expect(updatedSensors).toEqual([])
  })

  it("keeps sensor membership unchanged and shows a snackbar when the update fails", () => {
    role = "admin"
    updateFails = true
    fixture = TestBed.createComponent(AreaListComponent)
    fixture.detectChanges()

    const component = fixture.componentInstance
    const dropEvent = { item: { data: sensor } } as CdkDragDrop<Sensor[], Sensor[]>
    component.onSensorDrop(dropEvent, destinationArea.id)

    expect(component.getSensors(area.id)).toEqual([sensor])
    expect(component.getSensors(destinationArea.id)).toEqual([])
    expect(snackbarMessages).toEqual(["Failed to update!"])
  })
})
