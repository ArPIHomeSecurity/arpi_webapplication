import { NO_ERRORS_SCHEMA } from "@angular/core"
import { ComponentFixture, TestBed } from "@angular/core/testing"
import { FormBuilder, ReactiveFormsModule } from "@angular/forms"
import { MatSnackBar } from "@angular/material/snack-bar"
import { ActivatedRoute, Router } from "@angular/router"
import { of, throwError } from "rxjs"

import { MONITORING_STATE, ZigbeeDevice, zigbeeZoneTypeLabel } from "@app/models"
import { ZigbeeDeviceDetailComponent } from "./zigbee-device-detail.component"

describe("ZigbeeDeviceDetailComponent", () => {
  let component: ZigbeeDeviceDetailComponent
  let fixture: ComponentFixture<ZigbeeDeviceDetailComponent>
  let requestedDeviceIds: number[]
  let submittedDevices: Array<Partial<ZigbeeDevice> & { id: number }>
  let navigationCalls: Array<Array<string | number>>
  let snackBarMessages: string[]
  let failUpdate: boolean

  const device: ZigbeeDevice = {
    id: 42,
    ieeeAddress: "00:11:22:33:44:55:66:77",
    name: "Hallway",
    zoneType: 0x0015
  }

  beforeEach(async () => {
    requestedDeviceIds = []
    submittedDevices = []
    navigationCalls = []
    snackBarMessages = []
    failUpdate = false

    await TestBed.configureTestingModule({
      declarations: [ZigbeeDeviceDetailComponent],
      imports: [ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        FormBuilder,
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => "42" } } }
        },
        {
          provide: Router,
          useValue: {
            navigate: commands => {
              navigationCalls.push(commands)
              return Promise.resolve(true)
            }
          }
        },
        {
          provide: MatSnackBar,
          useValue: { open: message => snackBarMessages.push(message) }
        },
        { provide: "EventService", useValue: { listen: () => of(), isConnected: () => of(true) } },
        {
          provide: "LoaderService",
          useValue: { display: () => {}, disable: () => {}, clearMessage: () => {} }
        },
        {
          provide: "MonitoringService",
          useValue: { getMonitoringState: () => of(MONITORING_STATE.READY) }
        },
        {
          provide: "ZigbeeService",
          useValue: {
            getDevice: id => {
              requestedDeviceIds.push(id)
              return of(device)
            },
            updateDevice: submittedDevice => {
              submittedDevices.push(submittedDevice)
              return failUpdate ? throwError(() => new Error("update failed")) : of(device)
            }
          }
        }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(ZigbeeDeviceDetailComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it("loads the device name into the form", () => {
    expect(requestedDeviceIds).toContain(device.id)
    expect(component.deviceForm.controls.name.value).toBe(device.name)
  })

  it("displays the reported IAS type without an editable control", () => {
    expect(fixture.nativeElement.textContent).toContain("Contact switch")
    expect(component.deviceForm.get("zoneType")).toBeNull()
  })

  it("handles missing, invalid and manufacturer-specific zone types", () => {
    expect(zigbeeZoneTypeLabel(null)).toBe("Unknown")
    expect(zigbeeZoneTypeLabel(0xffff)).toBe("Unknown")
    expect(zigbeeZoneTypeLabel(0xabcd)).toBe("0xabcd")
    expect(zigbeeZoneTypeLabel(0)).toBe("Control and indicating equipment")
  })

  it("requires a name with at most 64 characters", () => {
    const nameControl = component.deviceForm.controls.name

    nameControl.setValue("")
    expect(nameControl.hasError("required")).toBeTrue()

    nameControl.setValue("a".repeat(65))
    expect(nameControl.hasError("maxlength")).toBeTrue()
  })

  it("updates only the device name and returns to the list", () => {
    component.deviceForm.controls.name.setValue("Entryway")

    component.onSubmit()

    expect(submittedDevices).toEqual([{ id: device.id, name: "Entryway" }])
    expect(navigationCalls).toEqual([["/config/zigbee"]])
    expect(snackBarMessages.length).toBe(1)
  })

  it("shows feedback and stays on the form when the update fails", () => {
    failUpdate = true
    component.deviceForm.controls.name.setValue("Entryway")

    component.onSubmit()

    expect(snackBarMessages.length).toBe(1)
    expect(navigationCalls).toEqual([])
  })
})
