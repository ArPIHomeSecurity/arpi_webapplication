/* global jasmine, spyOn */

import { ComponentFixture, TestBed } from "@angular/core/testing"
import { MatCardModule } from "@angular/material/card"
import { MatDialog } from "@angular/material/dialog"
import { MatIconModule } from "@angular/material/icon"

import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http"

import { AUTHENTICATION_SERVICE } from "@app/tokens"

import { environment } from "@environments/environment"
import { MockAuthenticationService, MockMonitoringService } from "testing"
import { LocationListComponent } from "./location-list.component"

describe("LocationListComponent", () => {
  let component: LocationListComponent
  let fixture: ComponentFixture<LocationListComponent>
  const biometricCalls: string[] = []
  const biometricService = {
    isAvailable: () => Promise.resolve(true),
    isBiometricEnabled: (locationId: string) => {
      biometricCalls.push(locationId)
      return true
    },
    enableBiometricLogin: () => undefined,
    disableBiometricLogin: () => undefined
  }
  const dialog = {
    open: jasmine.createSpy("open")
  }

  beforeEach(async () => {
    dialog.open.calls.reset()
    await TestBed.configureTestingModule({
      declarations: [LocationListComponent],
      imports: [MatCardModule, MatIconModule],
      providers: [
        {
          provide: AUTHENTICATION_SERVICE,
          useClass: MockAuthenticationService
        },
        { provide: "BiometricService", useValue: biometricService },
        { provide: "EventService", useClass: environment.eventService },
        { provide: "LoaderService", useClass: environment.loaderService },
        { provide: "MonitoringService", useClass: MockMonitoringService },
        {
          provide: "NotificationService",
          useClass: environment.notificationService
        },
        {
          provide: "ConfigurationService",
          useClass: environment.configurationService
        },
        { provide: MatDialog, useValue: dialog },
        provideHttpClient(withInterceptorsFromDi())
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(LocationListComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it("should create", () => {
    expect(component).toBeTruthy()
  })

  it("should expose biometric state for a location", () => {
    component.biometricAvailable = true

    expect(component.isBiometricEnabled("location-1")).toBeTrue()
    expect(biometricCalls).toContain("location-1")
  })

  it("should identify registered locations using their device token", () => {
    spyOn(component.authenticationService, "getDeviceToken").and.callFake(locationId =>
      locationId === "location-1" ? "device-token" : null
    )

    expect(component.isRegistered("location-1")).toBeTrue()
    expect(component.isRegistered("missing-location")).toBeFalse()
  })

  it("should disable unregister for the selected logged-in location", () => {
    component.selectedLocationId = "location-1"
    spyOn(component.authenticationService, "isLoggedIn").and.returnValue(true)

    expect(component.isUnregisterDisabled("location-1")).toBeTrue()
    expect(component.isUnregisterDisabled("location-2")).toBeFalse()
  })

  it("should enable unregister for the selected logged-out location", () => {
    component.selectedLocationId = "location-1"
    spyOn(component.authenticationService, "isLoggedIn").and.returnValue(false)

    expect(component.isUnregisterDisabled("location-1")).toBeFalse()
  })

  it("should pass the location id when unregister is confirmed", () => {
    const afterClosed = jasmine.createSpy("afterClosed")
    afterClosed.and.returnValue({ subscribe: callback => callback("ok") })
    const dialogRef = { afterClosed }
    dialog.open.and.returnValue(dialogRef)
    const unregister = spyOn(component.authenticationService, "unRegisterDevice")

    component.openUnregisterDialog("location-1")

    expect(dialog.open).toHaveBeenCalledWith(
      jasmine.anything(),
      jasmine.objectContaining({
        width: "450px",
        data: jasmine.objectContaining({
          title: "Unregister device",
          message: "Are you sure you want to unregister this device?"
        })
      })
    )
    expect(unregister).toHaveBeenCalledWith("location-1")
  })

  it("should not unregister when confirmation is cancelled", () => {
    const afterClosed = jasmine.createSpy("afterClosed")
    afterClosed.and.returnValue({ subscribe: callback => callback("cancel") })
    const dialogRef = { afterClosed }
    dialog.open.and.returnValue(dialogRef)
    const unregister = spyOn(component.authenticationService, "unRegisterDevice")

    component.openUnregisterDialog("location-1")

    expect(unregister).not.toHaveBeenCalled()
  })
})
