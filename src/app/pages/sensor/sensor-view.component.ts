import { Component, Inject, OnDestroy, OnInit } from "@angular/core"
import { ActivatedRoute, Router } from "@angular/router"

import { MatDialog } from "@angular/material/dialog"
import { MatSnackBar } from "@angular/material/snack-bar"

import { forkJoin, of } from "rxjs"
import { catchError, finalize } from "rxjs/operators"

import { QuestionDialogComponent } from "@app/components/question-dialog/question-dialog.component"
import { buildSensorAttributeGroups } from "@app/components/sensor/sensor-attribute-builder"
import { SensorAttribute } from "@app/components/sensor/sensor-card/sensor-card.component"
import { ConfigurationBaseComponent } from "@app/configuration-base/configuration-base.component"
import { MONITORING_STATE, Sensor, SensorType, ZigbeeDevice } from "@app/models"
import {
  AreaService,
  AuthenticationService,
  EventService,
  LoaderService,
  MonitoringService,
  SensorService,
  ZigbeeService,
  ZoneService
} from "@app/services"
import { AUTHENTICATION_SERVICE } from "@app/tokens"
import { environment } from "@environments/environment"

const scheduleMicrotask = Promise.resolve(null)

@Component({
  templateUrl: "./sensor-view.component.html",
  styleUrls: ["./sensor-view.component.scss"],
  standalone: false
})
export class SensorViewComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  sensor: Sensor = undefined
  iconName: string
  attributeGroups: SensorAttribute[][] = []
  notFound = false
  loadError = false

  constructor(
    @Inject("EventService") eventService: EventService,
    @Inject("LoaderService") public loader: LoaderService,
    @Inject("MonitoringService") monitoringService: MonitoringService,
    @Inject("SensorService") private sensorService: SensorService,
    @Inject("AreaService") private areaService: AreaService,
    @Inject("ZigbeeService") private zigbeeService: ZigbeeService,
    @Inject("ZoneService") private zoneService: ZoneService,
    @Inject(AUTHENTICATION_SERVICE) private authService: AuthenticationService,
    private router: Router,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    super(eventService, loader, monitoringService)
  }

  ngOnInit() {
    super.initialize()
    this.editableStates.push(MONITORING_STATE.INVALID_CONFIG)

    scheduleMicrotask.then(() => {
      this.loader.display(true)
      this.baseSubscriptions.push(
        this.route.paramMap.subscribe(params => this.loadSensor(Number(params.get("id"))))
      )
    })
    this.baseSubscriptions.push(
      this.eventService.listen("sensors_state_change").subscribe(() => {
        this.loader.display(true)
        this.loadSensor()
      })
    )
  }

  ngOnDestroy() {
    super.destroy()
  }

  userCanEdit() {
    return this.authService.getRole() === "admin"
  }

  loadSensor(sensorId = Number(this.route.snapshot.paramMap.get("id"))) {
    if (!Number.isSafeInteger(sensorId) || sensorId <= 0) {
      this.sensor = null
      this.notFound = true
      this.loader.display(false)
      return
    }

    this.notFound = false
    this.loadError = false
    forkJoin({
      sensor: this.sensorService.getSensor(sensorId),
      sensorTypes: this.sensorService.getSensorTypes(),
      zigbeeDevices: this.zigbeeService.getDevices().pipe(catchError(() => of([]))),
      zones: this.zoneService.getZones(),
      areas: this.areaService.getAreas(),
      boardVersion: this.monitoringService.getBoardVersion()
    })
      .pipe(finalize(() => this.loader.display(false)))
      .subscribe({
        next: results => {
          this.sensor = results.sensor
          const sensorTypes = results.sensorTypes.sort((left, right) => left.id - right.id)
          const sensorTypeName =
            sensorTypes.find(type => type.id === this.sensor.typeId)?.name ?? ""
          this.iconName = SensorType.getIconName(sensorTypeName)
          this.attributeGroups = buildSensorAttributeGroups(
            this.sensor,
            sensorTypes,
            new Map(
              results.zigbeeDevices.map(device => [device.id, device] as [number, ZigbeeDevice])
            ),
            results.zones,
            results.areas,
            results.boardVersion
          )
        },
        error: error => {
          this.sensor = null
          this.notFound = error.status === 404
          this.loadError = !this.notFound
        }
      })
  }

  onResetReferences(sensorId: number) {
    this.sensorService.resetReference(sensorId)
  }

  openDeleteDialog(sensorId: number) {
    const dialogRef = this.dialog.open(QuestionDialogComponent, {
      width: "450px",
      data: {
        title: $localize`:@@delete sensor:Delete Sensor`,
        message: $localize`:@@delete sensor message:Are you sure you want to delete the sensor "${this.sensor.description}"?`,
        options: [
          { id: "ok", text: $localize`:@@delete:Delete`, color: "warn" },
          { id: "cancel", text: $localize`:@@cancel:Cancel` }
        ]
      }
    })

    dialogRef.afterClosed().subscribe(result => {
      if (result !== "ok") return
      if (this.monitoringState !== MONITORING_STATE.READY) {
        this.snackBar.open(
          $localize`:@@cant delete state:Cannot delete while not in READY state!`,
          null,
          { duration: environment.snackDuration }
        )
        return
      }

      this.loader.disable(true)
      this.sensorService
        .deleteSensor(sensorId)
        .pipe(finalize(() => this.loader.disable(false)))
        .subscribe({
          next: () => {
            this.snackBar.open($localize`:@@sensor deleted:Sensor deleted!`, null, {
              duration: environment.snackDuration
            })
            this.router.navigate(["/sensors"])
          },
          error: () =>
            this.snackBar.open($localize`:@@failed delete:Failed to delete!`, null, {
              duration: environment.snackDuration
            })
        })
    })
  }
}
