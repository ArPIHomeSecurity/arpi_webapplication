import { Component, Inject } from "@angular/core"
import { FormControl, FormGroup, Validators } from "@angular/forms"
import { MatDialog } from "@angular/material/dialog"
import { ActivatedRoute, Router } from "@angular/router"
import { QuestionDialogComponent } from "@app/components/question-dialog/question-dialog.component"
import { Location } from "@app/models"
import { AuthenticationService, NotificationService } from "@app/services"
import { AUTHENTICATION_SERVICE } from "@app/tokens"
import { configureBackend } from "@app/utils"
import { environment } from "@environments/environment"
import { LocationVersion } from "../../models/version"
import {
  getLocationName,
  LocationTestResult,
  saveLocations,
  syncSelectedLocationId,
  testLocation
} from "./location"

@Component({
  selector: "app-location-details",
  templateUrl: "./location-details.component.html",
  styleUrls: ["./location-details.component.scss"],
  standalone: false
})
export class LocationDetailsComponent {
  ALREADY_EXISTS = $localize`:@@location already exists:Location already exists!`

  location: Location | null = null
  version: LocationVersion | null = null
  boardVersion: string | null = null
  locationForm: FormGroup | null = null
  newLocation = false
  firstLocation = false

  selectedLocationId: string | null = null
  testResult: LocationTestResult | null = null
  showApiLink = environment.showApiLink
  isMultiLocation = environment.isMultiLocation
  notificationsAvailable = false

  systemLocationName: string | null = null

  constructor(
    @Inject(AUTHENTICATION_SERVICE)
    public authenticationService: AuthenticationService,

    private route: ActivatedRoute,
    private router: Router,
    public dialog: MatDialog,
    @Inject("NotificationService")
    private notificationService: NotificationService
  ) {
    this.route.params.subscribe(params => {
      const locations: Location[] = JSON.parse(
        localStorage.getItem("locations") || "[]"
      )
      this.firstLocation = locations.length === 0
      if (params.id) {
        this.location =
          locations.find(location => location.id === params.id) || null
        this.newLocation = false
      } else {
        this.location = this.defaultLocation()
        this.newLocation = true
      }

      this.updateForm(this.location)
    })

    this.selectedLocationId = localStorage.getItem("selectedLocationId")
    this.notificationsAvailable = this.notificationService.isAvailable()
  }

  notificationsEnabled(): boolean {
    if (!this.location?.id) {
      return false
    }

    return this.notificationService.isEnabled(this.location.id)
  }

  enableNotifications(): void {
    if (!this.location?.id) {
      return
    }

    this.notificationService.enableNotifications(this.location.id)
  }

  disableNotifications(): void {
    if (!this.location?.id) {
      return
    }

    this.notificationService.disableNotifications(this.location.id)
  }

  defaultLocation(): Location {
    return {
      id: null,
      name: this.firstLocation ? "Default" : "",
      scheme: "https",
      primaryDomain: !this.isMultiLocation ? window.location.hostname : "",
      primaryPort: !this.isMultiLocation
        ? parseInt(window.location.port)
        : null,
      secondaryDomain: "",
      secondaryPort: null,
      version: null,
      boardVersion: null,
      order: 0
    }
  }

  updateForm(location: Location | null) {
    if (location) {
      this.locationForm = new FormGroup({
        id: new FormControl(location.id),
        name: new FormControl(location.name, Validators.required),
        scheme: new FormControl(location.scheme),
        primaryDomain: new FormControl(location.primaryDomain),
        primaryPort: new FormControl(location.primaryPort),
        secondaryDomain: new FormControl(location.secondaryDomain),
        secondaryPort: new FormControl(location.secondaryPort),
        notifications: new FormControl(this.notificationsEnabled())
      })
    }
  }

  executeLocationTest() {
    this.location = this.prepareLocation()
    this.testResult = new LocationTestResult()
    testLocation(this.location).subscribe(result => {
      this.testResult = result
      if (
        result.primaryLocationId &&
        result.secondaryLocationId &&
        result.primaryLocationId !== result.secondaryLocationId
      ) {
        console.error(
          "Primary and secondary location IDs do not match!",
          result
        )
      } else if (result.primaryLocationId) {
        this.location.id = result.primaryLocationId
        this.version = result.primaryVersion
        this.boardVersion = result.primaryBoardVersion
      } else if (result.secondaryLocationId) {
        this.location.id = result.secondaryLocationId
        this.version = result.secondaryVersion
        this.boardVersion = result.secondaryBoardVersion
      }
    })

    getLocationName(this.location).subscribe(locationName => {
      this.systemLocationName = locationName || null
    })
  }

  isRegistered() {
    if (!this.locationForm.value.id) {
      return false
    }

    return (
      this.authenticationService.getDeviceToken(this.locationForm.value.id) !==
      null
    )
  }

  onFieldChange($event) {
    // add default port if domain was empty
    if (
      $event.target.name === "primaryDomain" &&
      this.location.primaryDomain === "" &&
      this.locationForm.value.primaryPort === null
    ) {
      this.locationForm.controls.primaryPort.setValue(443)
    }
    if (
      $event.target.name === "secondaryDomain" &&
      this.location.secondaryDomain === "" &&
      this.locationForm.value.secondaryPort === null
    ) {
      this.locationForm.controls.secondaryPort.setValue(443)
    }

    // clear test result if any field changes
    this.testResult = null
  }

  onCancel() {
    if (environment.isMultiLocation) {
      this.router.navigate(["/locations"])
    } else {
      this.router.navigate(["/setup"])
    }
  }

  onSaveRemoteToLocalname() {
    if (this.systemLocationName) {
      this.locationForm.controls.name.setValue(this.systemLocationName)
    }
  }

  prepareLocation(): Location {
    const formModel = this.locationForm.value
    const location = new Location()
    location.id = formModel.id || this.location.id
    location.name = formModel.name
    location.scheme = formModel.scheme
    location.primaryDomain = formModel.primaryDomain
    location.primaryPort = formModel.primaryPort
    location.secondaryDomain = formModel.secondaryDomain
    location.secondaryPort = formModel.secondaryPort
    location.order = this.location.order
    // use the version loaded from the test or keep the existing one
    location.version = this.version ? this.version : this.location.version
    location.boardVersion = this.boardVersion
      ? this.boardVersion
      : this.location.boardVersion
    return location
  }

  alreadyExists() {
    const locations: Location[] = JSON.parse(
      localStorage.getItem("locations") || "[]"
    )
    return locations.some(l => l.id === this.location?.id)
  }

  cantSave() {
    // do not save if location Id is not set
    if (!this.location?.id) {
      return true
    }

    // do not save if new location already exists
    if (this.alreadyExists() && this.newLocation) {
      return true
    }

    // do not save if location form is invalid or pristine
    if (this.locationForm?.invalid || this.locationForm?.pristine) {
      return true
    }

    // do not save if primary or secondary is dirty and not tested
    if (
      this.locationForm?.controls?.primaryDomain?.dirty ||
      this.locationForm?.controls?.secondaryDomain?.dirty
    ) {
      if (this.testResult === null) {
        return true
      }

      if (
        this.testResult.primary === null ||
        this.testResult.secondary === null
      ) {
        return true
      }
    }

    return false
  }

  async onSubmit() {
    const location = this.prepareLocation()
    const locations: Location[] = JSON.parse(
      localStorage.getItem("locations") || "[]"
    )
    const index = locations.findIndex(l => l.id === location.id)
    if (index >= 0) {
      // merge
      locations[index] = { ...locations[index], ...location }
    } else {
      locations.push(location)
    }

    saveLocations(locations)

    const notificationsEnabled = this.locationForm?.value?.notifications
    if (notificationsEnabled === true) {
      this.enableNotifications()
    }
    if (notificationsEnabled === false) {
      this.disableNotifications()
    }

    // select the new location if there is no working selection yet
    this.selectedLocationId = syncSelectedLocationId(locations, location.id)
    // configure the backend before navigating, otherwise the first request fails
    await configureBackend()

    if (this.isMultiLocation) {
      this.router.navigate(["/locations"])
    } else {
      this.router.navigate(["/setup"])
    }
  }

  openDeleteDialog() {
    let locations = JSON.parse(localStorage.getItem("locations") || "[]")
    const dialogRef = this.dialog.open(QuestionDialogComponent, {
      width: "450px",
      data: {
        title: $localize`:@@delete location:Delete Location`,
        message: $localize`:@@delete location message:Are you sure you want to delete the location "${this.location.name}"?`,
        options: [
          {
            id: "ok",
            text: $localize`:@@delete:Delete`,
            color: "warn"
          },
          {
            id: "cancel",
            text: $localize`:@@cancel:Cancel`
          }
        ]
      }
    })

    dialogRef.afterClosed().subscribe(async result => {
      if (result === "ok") {
        locations = locations.filter(x => x.id !== this.location.id)
        saveLocations(locations)
        this.selectedLocationId = syncSelectedLocationId(locations)
        await configureBackend()

        if (this.isMultiLocation) {
          this.router.navigate(["/locations"])
        } else {
          this.router.navigate(["/setup"])
        }
      }
    })
  }
}
