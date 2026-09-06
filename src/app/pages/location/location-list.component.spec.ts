import { ComponentFixture, TestBed } from "@angular/core/testing"
import { MatCardModule } from "@angular/material/card"
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

  beforeEach(async () => {
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
})
