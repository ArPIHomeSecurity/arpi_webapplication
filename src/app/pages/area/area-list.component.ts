import { CdkDragDrop, CdkDragEnd, CdkDragStart, moveItemInArray } from "@angular/cdk/drag-drop"
import { Component, Inject, OnDestroy, OnInit } from "@angular/core"
import { MatDialog } from "@angular/material/dialog"
import { MatSnackBar } from "@angular/material/snack-bar"

import { forkJoin } from "rxjs"
import { finalize } from "rxjs/operators"

import { QuestionDialogComponent } from "@app/components/question-dialog/question-dialog.component"
import { ConfigurationBaseComponent } from "@app/configuration-base/configuration-base.component"
import { Area, MONITORING_STATE, Output, Sensor, SensorType } from "@app/models"
import {
  AreaService,
  AuthenticationService,
  EventService,
  LoaderService,
  OutputService,
  SensorService
} from "@app/services"

import { AUTHENTICATION_SERVICE } from "@app/tokens"
import { environment } from "@environments/environment"

const scheduleMicrotask = Promise.resolve(null)

@Component({
  templateUrl: "area-list.component.html",
  styleUrls: ["area-list.component.scss"],
  providers: [],
  standalone: false
})
export class AreaListComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  readonly SensorType = SensorType

  CONFIG = 0
  SENSORS = 1

  areas: Area[] = null
  outputs: Output[] = []
  sensors: Sensor[] = []
  sensorTypes: SensorType[] = []
  outputListOpened: boolean[] = []
  sensorListOpened: boolean[] = []
  sensorDropListIds: string[] = []
  isDragging = false
  isUpdatingSensor = false

  constructor(
    @Inject("AreaService") private areaService: AreaService,
    @Inject(AUTHENTICATION_SERVICE) public authService: AuthenticationService,
    @Inject("EventService") public eventService: EventService,
    @Inject("LoaderService") public loader: LoaderService,
    @Inject("MonitoringService") public monitoringService,
    @Inject("OutputService") private outputService: OutputService,
    @Inject("SensorService") private sensorService: SensorService,

    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    super(eventService, loader, monitoringService)
  }

  ngOnInit() {
    super.initialize()

    // avoid ExpressionChangedAfterItHasBeenCheckedError
    // https://github.com/angular/angular/issues/17572#issuecomment-323465737
    scheduleMicrotask.then(() => {
      this.loader.display(true)
    })

    this.updateComponent()
  }

  ngOnDestroy() {
    super.destroy()
  }

  updateComponent() {
    if (this.isDragging || this.isUpdatingSensor) return

    forkJoin({
      areas: this.areaService.getAreas(),
      outputs: this.outputService.getOutputs(),
      sensors: this.sensorService.getSensors(),
      sensorTypes: this.sensorService.getSensorTypes()
    })
      .pipe(finalize(() => this.loader.display(false)))
      .subscribe(results => {
        this.areas = results.areas.sort((a, b) => a.uiOrder - b.uiOrder)
        this.sensorDropListIds = this.areas.flatMap(area => [
          `area-sensors-${area.id}`,
          `area-sensors-header-${area.id}`
        ])
        this.outputs = results.outputs
        this.sensors = results.sensors
        this.sensorTypes = results.sensorTypes
        this.loader.display(false)
        this.loader.disable(false)
      })
  }

  getSensors(areaId: number): Sensor[] {
    const results: Sensor[] = []
    this.sensors.forEach(sensor => {
      if (sensor.areaId === areaId) {
        results.push(sensor)
      }
    })

    return results
  }

  getSensorTypeName(sensorTypeId: number) {
    return this.sensorTypes.find(sensorType => sensorType.id === sensorTypeId)?.name ?? ""
  }

  getOutputs(areaId: number): Output[] {
    const results: Output[] = []
    this.outputs.forEach(output => {
      if (output.areaId === areaId) {
        results.push(output)
      }
    })

    return results
  }

  userCanEdit() {
    return this.authService.getRole() === "admin"
  }

  openDeleteDialog(areaId: number) {
    const area = this.areas.find(x => x.id === areaId)
    const dialogRef = this.dialog.open(QuestionDialogComponent, {
      width: "450px",
      data: {
        title: $localize`:@@delete area:Delete Area`,
        message: $localize`:@@delete area message:Are you sure you want to delete the area "${area.name}"?`,
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

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (this.monitoringState === MONITORING_STATE.READY) {
          this.loader.disable(true)
          this.areaService
            .deleteArea(areaId)
            .pipe(finalize(() => this.loader.disable(false)))
            .subscribe({
              next: _ => {
                this.snackBar.open($localize`:@@area deleted:Area deleted!`, null, {
                  duration: environment.snackDuration
                })
                this.updateComponent()
              },
              error: _ =>
                this.snackBar.open($localize`:@@failed delete:Failed to delete!`, null, {
                  duration: environment.snackDuration
                })
            })
        } else {
          this.snackBar.open(
            $localize`:@@cant delete state:Cannot delete while not in READY state!`,
            null,
            {
              duration: environment.snackDuration
            }
          )
        }
      }
    })
  }

  onDragStarted(_event: CdkDragStart<string[]>) {
    this.isDragging = true
  }

  onDrop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.areas, event.previousIndex, event.currentIndex)
    this.areas.forEach((area, index) => {
      area.uiOrder = index
    })

    this.areaService.reorder(this.areas)
    this.isDragging = false
    // delayed update
    setTimeout(() => this.updateComponent(), 500)
  }

  onSensorDragStarted() {
    this.isDragging = true
  }

  onSensorDragEnded(_event: CdkDragEnd<Sensor>) {
    this.isDragging = false
  }

  onSensorDrop(event: CdkDragDrop<Sensor[], Sensor[]>, areaId: number) {
    const sensor = event.item.data
    const sourceAreaId = sensor.areaId
    if (
      !this.userCanEdit() ||
      this.monitoringState !== MONITORING_STATE.READY ||
      sensor.areaId === areaId
    ) {
      return
    }

    this.isUpdatingSensor = true
    this.sensorService
      .updateSensor({ ...sensor, areaId })
      .pipe(finalize(() => (this.isUpdatingSensor = false)))
      .subscribe({
        next: updatedSensor => {
          this.sensors = this.sensors.map(current =>
            current.id === updatedSensor.id ? updatedSensor : current
          )
          if (this.getSensors(sourceAreaId).length === 0) {
            this.onCloseSensorList(sourceAreaId)
          }
          this.onOpenSensorList(areaId)
        },
        error: () =>
          this.snackBar.open($localize`:@@failed update:Failed to update!`, null, {
            duration: environment.snackDuration
          })
      })
  }

  onOpenSensorList(areaId: number) {
    this.sensorListOpened[areaId] = true
  }

  onCloseSensorList(areaId: number) {
    this.sensorListOpened[areaId] = false
  }
}
