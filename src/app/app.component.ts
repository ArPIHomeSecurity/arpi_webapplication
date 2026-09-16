import { Component, ElementRef, Inject, NgZone, OnInit, ViewChild } from "@angular/core"
import { MatSidenav } from "@angular/material/sidenav"
import { MatSnackBar } from "@angular/material/snack-bar"
import { BehaviorSubject, fromEvent } from "rxjs"

import { Capacitor } from "@capacitor/core"
import { StatusBar, Style } from "@capacitor/status-bar"

import { HttpClient } from "@angular/common/http"
import { HumanizeDuration, HumanizeDurationLanguage } from "humanize-duration-ts"
import { CountdownComponent } from "ngx-countdown"

import { Router } from "@angular/router"
import { environment } from "@environments/environment"
import { Location, ROLE_TYPES } from "./models"
import { AuthenticationService, LoaderService, MonitoringService } from "./services"
import { ThemeService } from "./services/theme.service"
import { AUTHENTICATION_SERVICE } from "./tokens"
import { PATH_PARSER, redirectTo } from "./utils"

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  standalone: false
})
export class AppComponent implements OnInit {
  @ViewChild("sidenav") sidenav: MatSidenav
  @ViewChild("counter") private countdown: CountdownComponent

  // display error message of the components
  displayLoader = false
  disablePage = false
  message: string | null = null
  redirectToRemote = !environment.isMultiLocation

  locations: Location[] = []
  selectedLocationId: string | null = null

  versions: {
    serverVersion: string
    webapplicationVersion: string
    boardVersion: string
  }

  isMultiLocation = environment.isMultiLocation
  demoMode = environment.demo

  countdownConfig = {
    leftTime: environment.userTokenExpiry,
    format: "mm:ss",
    notify: [environment.userTokenExpiry / 3]
  }
  isSessionValid: boolean

  langService: HumanizeDurationLanguage = new HumanizeDurationLanguage()
  humanizer: HumanizeDuration = new HumanizeDuration(this.langService)

  // theming
  width$ = new BehaviorSubject<number>(1000)
  resizeObserver!: ResizeObserver
  smallScreen = false
  darkTheme = false

  constructor(
    @Inject(AUTHENTICATION_SERVICE)
    public authenticationService: AuthenticationService,
    @Inject("LoaderService") private loader: LoaderService,
    @Inject("MonitoringService") private monitoring: MonitoringService,
    @Inject("ThemeService") private themeService: ThemeService,
    public router: Router,
    private snackBar: MatSnackBar,

    private host: ElementRef,
    private zone: NgZone,
    private http: HttpClient
  ) {
    this.versions = {
      serverVersion: "",
      webapplicationVersion: "",
      boardVersion: ""
    }
    this.isSessionValid = false
  }

  async ngOnInit() {
    this.darkTheme = this.themeService.load()

    // check platform android
    if (Capacitor.getPlatform() === "android") {
      // set static status bar style to dark (white on indigo)
      await StatusBar.setStyle({ style: Style.Dark })
    }

    this.resizeObserver = new ResizeObserver(entries => {
      this.zone.run(() => {
        this.width$.next(entries[0].contentRect.width)
      })
    })
    this.resizeObserver.observe(this.host.nativeElement)

    this.width$.subscribe(width => {
      if (width > 640) {
        this.smallScreen = false
        this.themeService.updateSize(false)
        if (this.sidenav) {
          this.sidenav.opened = true
          this.sidenav.mode = "side"
          this.sidenav.disableClose = true
        }
      } else {
        this.smallScreen = true
        this.themeService.updateSize(true)
        if (this.sidenav) {
          this.sidenav.opened = false
          this.sidenav.mode = "over"
          this.sidenav.disableClose = false
        }
      }
    })

    this.loader.displayed.subscribe(value => (this.displayLoader = value))
    this.loader.disabled.subscribe(value => (this.disablePage = value))
    this.loader.message.subscribe(message => (this.message = message))
    this.monitoring.getVersion().subscribe(version => (this.versions.serverVersion = version))
    this.monitoring
      .getBoardVersion()
      .subscribe(version => (this.versions.boardVersion = version.toString()))
    this.authenticationService.isSessionValid().subscribe(isSessionValid => {
      this.isSessionValid = isSessionValid
      if (this.isSessionValid && this.countdown) {
        this.countdown.restart()
      }
    })

    const locations: Location[] = JSON.parse(localStorage.getItem("locations") || "[]")
    this.locations = locations.sort((a, b) => a.order - b.order)

    this.selectedLocationId = localStorage.getItem("selectedLocationId")

    fromEvent(window, "storage").subscribe(this.onConfigurationChanged.bind(this))

    // Load version from assets/version.json (new format)
    this.http
      .get<{
        version: string
        major: number
        minor: number
        patch: number
        prerelease: string | null
        prerelease_num: number | null
        commit_id: string
      }>("assets/version.json")
      .subscribe({
        next: data => {
          // use the version string directly
          this.versions.webapplicationVersion = data.version
        },
        error: error => {
          this.versions.webapplicationVersion = "unknown"
        }
      })
  }

  isLoggedIn() {
    return this.authenticationService.isLoggedIn()
  }

  isConnected() {
    return (
      localStorage.getItem("backend.scheme") !== null &&
      localStorage.getItem("backend.domain") !== null
    )
  }

  logout(manualAction: boolean) {
    this.countdown.stop()
    this.authenticationService.logout(manualAction)
  }

  getUserName() {
    return this.authenticationService.getUsername()
  }

  isAdminUser() {
    return this.authenticationService.getRole() === ROLE_TYPES.ADMIN
  }

  getLocationName() {
    if (this.selectedLocationId !== null) {
      const location = this.locations.find(i => i.id === this.selectedLocationId)
      if (location) {
        return location.name
      }
    }

    return ""
  }

  getBackend() {
    const backendScheme = localStorage.getItem("backend.scheme")
    const backendDomain = localStorage.getItem("backend.domain")
    const backendPort = localStorage.getItem("backend.port")
    return `${backendScheme}://${backendDomain}:${backendPort}`
  }

  onConfigurationChanged(event: StorageEvent) {
    if (event.key === "locations") {
      const locations = JSON.parse(event.newValue)
      this.locations = locations
        .sort((a, b) => a.order - b.order)
        .map(i => ({ name: i.name, id: i.id }))
    } else if (event.key === "selectedLocationId") {
      this.selectedLocationId = event.newValue
    }
  }

  onLocationChange(event) {
    this.selectedLocationId = event.value
    localStorage.setItem("selectedLocationId", event.value)

    // navigate to the default page and reload the page
    localStorage.removeItem("returnUrl")
    redirectTo("/")
  }

  handleCountdown($event) {
    if ($event.action === "notify") {
      this.snackBar.open(
        $localize`:@@session expiry:Your session will expire in ${this.getSessionDuration()}!`,
        null,
        {
          duration: environment.snackDuration
        }
      )
    } else if ($event.action === "done") {
      this.snackBar.open($localize`:@@session expired:Your session expired, logged out!`, null, {
        duration: environment.snackDuration
      })
      this.logout(false)
    }
  }

  getSessionDuration() {
    let currentLocale = localStorage.getItem("localeId")
    if (!currentLocale) {
      currentLocale = "en"
    }
    return this.humanizer.humanize((environment.userTokenExpiry / 3) * 1000, {
      language: currentLocale
    })
  }

  openHelp() {
    // get current path
    const currentPath = location.pathname

    // remove version and language from the path
    const matches = PATH_PARSER.exec(currentPath)
    let pathWithoutLanguage = ""
    if (matches !== null) {
      pathWithoutLanguage = matches.groups.path
    }

    // remove trailing ids from the path
    // example sensor/123 => sensor
    let basePath = pathWithoutLanguage.replace(/\/[0-9]+$/, "")

    // remove location id like "60f10270003f4530e2ba6c09190bf87b731c96185983c8b43147a863ac730ca8"
    basePath = basePath.replace(/\/[a-f0-9]{64}$/, "")

    // mapping of local urls to documentation urls
    const urlMap = {
      "": "en/latest/end_users/",
      login: "en/latest/end_users/login/",
      events: "en/latest/end_users/events/",

      locations: "en/latest/end_users/locations/",
      "location/add": "en/latest/end_users/locations/#edit-location",
      location: "en/latest/end_users/locations/#edit-location",
      setup: "en/latest/end_users/locations/",

      areas: "en/latest/end_users/areas/",
      "area/add": "en/latest/end_users/areas/#edit-area",
      area: "en/latest/end_users/areas/#edit-area",
      outputs: "en/latest/end_users/outputs/",
      "output/add": "en/latest/end_users/outputs/#edit-output",
      output: "en/latest/end_users/outputs/#edit-output",
      sensors: "en/latest/end_users/sensors/",
      "sensor/add": "en/latest/end_users/sensors/#edit-area",
      sensor: "en/latest/end_users/sensors/#edit-area",
      users: "en/latest/end_users/users/",
      "user/add": "en/latest/end_users/users/#edit-user",
      user: "en/latest/end_users/users/#edit-user",
      zones: "en/latest/end_users/zones/",
      "zone/add": "en/latest/end_users/zones/#edit-zone",
      zone: "en/latest/end_users/zones/#edit-zone",

      "config/syren": "en/latest/end_users/syren/",
      "config/keypad": "en/latest/end_users/keypad/",
      "config/notifications/": "en/latest/end_users/notifications/",
      "config/network": "en/latest/end_users/network/",
      "config/clock": "en/latest/end_users/clock/"
    }

    if (!(basePath in urlMap)) {
      console.error("No mapping found for: " + basePath)
      basePath = ""
    }

    console.debug("Mapping: " + basePath + " => " + urlMap[basePath])
    // check if documentation path exists
    const http = new XMLHttpRequest()
    const url = "https://docs.arpi-security.info/" + urlMap[basePath]
    http.open("HEAD", url, false)

    try {
      http.send()
    } catch (error) {
      if (http.status === 404) {
        // fallback to main page
        basePath = ""
      }
    }

    // TODO:
    // * select documentation language
    // * select documentation version

    // open the documentation in a new window
    const documentationUrl = "https://docs.arpi-security.info/"
    window.open(documentationUrl + urlMap[basePath], "arpi-docs")
  }
}
