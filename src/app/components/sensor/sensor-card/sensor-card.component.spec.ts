/* global jasmine */

import { CommonModule } from "@angular/common"
import { NO_ERRORS_SCHEMA } from "@angular/core"
import { ComponentFixture, TestBed } from "@angular/core/testing"

import { MONITORING_STATE, Sensor } from "@app/models"
import { SensorCardComponent } from "./sensor-card.component"

describe("SensorCardComponent", () => {
  let component: SensorCardComponent
  let fixture: ComponentFixture<SensorCardComponent>

  const sensor = {
    id: 17,
    name: "Front door",
    description: "Main entrance",
    error: false,
    zigbeeDeviceId: null,
    alert: false,
    enabled: true
  } as Sensor

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SensorCardComponent],
      imports: [CommonModule],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents()

    fixture = TestBed.createComponent(SensorCardComponent)
    component = fixture.componentInstance
    component.sensor = sensor
    component.iconName = "sensors"
    component.attributeGroups = [[{ icon: "label", content: "CH01" }]]
    component.canEdit = true
    component.monitoringState = MONITORING_STATE.READY
  })

  it("renders the sensor and its attributes", () => {
    fixture.detectChanges()
    const text = fixture.nativeElement.textContent

    expect(text).toContain("Front door")
    expect(text).toContain("Main entrance")
    expect(text).toContain("CH01")
  })

  it("emits reset and delete requests for the sensor", () => {
    fixture.detectChanges()
    const resetReferences = jasmine.createSpy("resetReferences")
    const deleteRequested = jasmine.createSpy("deleteRequested")
    component.resetReferences.subscribe(resetReferences)
    component.deleteRequested.subscribe(deleteRequested)

    const buttons = fixture.nativeElement.querySelectorAll("button")
    buttons[2].click()
    buttons[3].click()

    expect(resetReferences).toHaveBeenCalledOnceWith(sensor.id)
    expect(deleteRequested).toHaveBeenCalledOnceWith(sensor.id)
  })

  it("hides actions when the user cannot edit", () => {
    component.canEdit = false
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelectorAll("button").length).toBe(0)
  })

  it("hides the drag handle when dragging is disabled", () => {
    component.dragDisabled = true
    fixture.detectChanges()

    expect(fixture.nativeElement.querySelector(".drag-handle")).toBeNull()
    expect(fixture.nativeElement.querySelectorAll("button").length).toBe(3)
  })

  it("disables actions outside editable monitoring states", () => {
    component.monitoringState = MONITORING_STATE.STARTUP
    fixture.detectChanges()

    const buttons = fixture.nativeElement.querySelectorAll("button") as {
      length: number
      [index: number]: { hasAttribute(name: string): boolean }
    }
    expect(
      Array.from({ length: buttons.length }, (_, index) => buttons[index]).every(button =>
        button.hasAttribute("disabled")
      )
    ).toBeTrue()
  })
})
