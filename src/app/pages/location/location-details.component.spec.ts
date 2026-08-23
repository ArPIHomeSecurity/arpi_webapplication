import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http"
import { ComponentFixture, TestBed } from "@angular/core/testing"
import { ActivatedRoute, Router } from "@angular/router"

import { Location } from "@app/models"
import { AUTHENTICATION_SERVICE } from "@app/tokens"
import { of } from "rxjs"

import { environment } from "@environments/environment"
import { MockAuthenticationService } from "testing"
import { LocationDetailsComponent } from "./location-details.component"

describe("LocationDetailsComponent", () => {
  let component: LocationDetailsComponent
  let fixture: ComponentFixture<LocationDetailsComponent>

  /**
   * Location without domain/port, so that configureBackend() does not perform any request.
   */
  function createLocation(id: string, name: string): Location {
    const location = new Location()
    location.id = id
    location.name = name
    location.scheme = "https"
    return location
  }

  /**
   * Prepare the component for onSubmit() as if the form was filled for the given location.
   */
  function editLocation(location: Location) {
    component.location = location
    component.updateForm(location)
  }

  let storageListeners: ((event: StorageEvent) => void)[] = []

  /**
   * Collect the keys of the storage events dispatched by the component.
   * The listeners are removed again in afterEach().
   */
  function recordStorageKeys(): string[] {
    const keys: string[] = []
    const listener = (event: StorageEvent) => keys.push(event.key)
    storageListeners.push(listener)
    window.addEventListener("storage", listener)
    return keys
  }

  beforeEach(async () => {
    localStorage.clear()

    await TestBed.configureTestingModule({
      declarations: [LocationDetailsComponent],
      imports: [],
      providers: [
        {
          provide: AUTHENTICATION_SERVICE,
          useClass: MockAuthenticationService
        },
        { provide: "EventService", useClass: environment.eventService },
        {
          provide: "NotificationService",
          useClass: environment.notificationService
        },
        provideHttpClient(withInterceptorsFromDi()),
        { provide: ActivatedRoute, useValue: { params: of({ id: "123" }) } },
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(LocationDetailsComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  afterEach(() => {
    storageListeners.forEach(listener =>
      window.removeEventListener("storage", listener)
    )
    storageListeners = []
    localStorage.clear()
  })

  it("should create", () => {
    expect(component).toBeTruthy()
  })

  it("should select the first created location", async () => {
    const location = createLocation("a".repeat(64), "Default")
    editLocation(location)
    const storageKeys = recordStorageKeys()

    await component.onSubmit()

    expect(localStorage.getItem("selectedLocationId")).toEqual(location.id)
    expect(component.selectedLocationId).toEqual(location.id)
    expect(storageKeys).toContain("selectedLocationId")
    expect(storageKeys).toContain("locations")
  })

  it("should keep the selected location when an other location is added", async () => {
    const selected = createLocation("a".repeat(64), "Selected")
    localStorage.setItem("locations", JSON.stringify([selected]))
    localStorage.setItem("selectedLocationId", selected.id)

    editLocation(createLocation("b".repeat(64), "New"))
    const storageKeys = recordStorageKeys()

    await component.onSubmit()

    expect(localStorage.getItem("selectedLocationId")).toEqual(selected.id)
    expect(component.selectedLocationId).toEqual(selected.id)
    expect(storageKeys).not.toContain("selectedLocationId")
    expect(JSON.parse(localStorage.getItem("locations")).length).toEqual(2)
  })

  it("should repair a selected location id pointing to a missing location", async () => {
    localStorage.setItem(
      "locations",
      JSON.stringify([createLocation("a".repeat(64), "Existing")])
    )
    localStorage.setItem("selectedLocationId", "c".repeat(64))

    const location = createLocation("b".repeat(64), "New")
    editLocation(location)

    await component.onSubmit()

    expect(localStorage.getItem("selectedLocationId")).toEqual(location.id)
    expect(component.selectedLocationId).toEqual(location.id)
  })

  it("should update an existing location without changing the selection", async () => {
    const selected = createLocation("a".repeat(64), "Old name")
    localStorage.setItem("locations", JSON.stringify([selected]))
    localStorage.setItem("selectedLocationId", selected.id)

    editLocation(createLocation(selected.id, "Old name"))
    component.locationForm.controls.name.setValue("New name")

    await component.onSubmit()

    const locations: Location[] = JSON.parse(localStorage.getItem("locations"))
    expect(locations.length).toEqual(1)
    expect(locations[0].name).toEqual("New name")
    expect(localStorage.getItem("selectedLocationId")).toEqual(selected.id)
  })
})
