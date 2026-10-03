import { Component, Inject, Input, OnDestroy, OnInit } from "@angular/core"

import { CdkDragDrop, CdkDragStart, moveItemInArray } from "@angular/cdk/drag-drop"
import { MatDialog } from "@angular/material/dialog"
import { MatSnackBar } from "@angular/material/snack-bar"

import { forkJoin, of } from "rxjs"
import { catchError, finalize } from "rxjs/operators"

import { QuestionDialogComponent } from "@app/components/question-dialog/question-dialog.component"
import { ConfigurationBaseComponent } from "@app/configuration-base/configuration-base.component"
import {
  Area,
  ChannelTypes,
  MONITORING_STATE,
  Sensor,
  SensorContactTypes,
  SensorEOLCount,
  SensorType,
  ZigbeeDevice,
  Zone
} from "@app/models"
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

interface SensorAttribute {
  icon: string
  iconClass?: string
  content: string
}

@Component({
  templateUrl: "sensor-list.component.html",
  styleUrls: ["sensor-list.component.scss"],
  providers: [],
  standalone: false
})
export class SensorListComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  readonly SensorType = SensorType

  @Input() onlyAlerting = false

  sensors: Sensor[] = null
  sensorTypes: SensorType[] = []
  zones: Zone[] = []
  areas: Area[] = []
  isDragging = false
  boardVersion: number
  zigbeeDevicesById = new Map<number, ZigbeeDevice>()
  sensorAttributeGroupsById = new Map<number, SensorAttribute[][]>()

  channelTypes = ChannelTypes
  sensorContactTypes = SensorContactTypes
  sensorEOLCount = SensorEOLCount

  constructor(
    @Inject("AreaService") public areaService: AreaService,
    @Inject(AUTHENTICATION_SERVICE) public authService: AuthenticationService,
    @Inject("EventService") public eventService: EventService,
    @Inject("LoaderService") public loader: LoaderService,
    @Inject("MonitoringService") public monitoringService: MonitoringService,
    @Inject("SensorService") private sensorService: SensorService,
    @Inject("ZigbeeService") private zigbeeService: ZigbeeService,
    @Inject("ZoneService") private zoneService: ZoneService,

    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    super(eventService, loader, monitoringService)
  }

  ngOnInit() {
    super.initialize()
    this.editableStates.push(MONITORING_STATE.INVALID_CONFIG)

    // avoid ExpressionChangedAfterItHasBeenCheckedError
    // https://github.com/angular/angular/issues/17572#issuecomment-323465737
    scheduleMicrotask.then(() => {
      this.loader.display(true)
    })
    this.updateComponent()

    // TODO: update only one sensor instead of the whole page
    this.baseSubscriptions.push(
      this.eventService.listen("sensors_state_change").subscribe(_ => this.updateComponent())
    )
  }

  ngOnDestroy() {
    super.destroy()
  }

  updateComponent() {
    if (this.isDragging) return

    forkJoin({
      sensors: this.sensorService.getSensors(this.onlyAlerting),
      sensorTypes: this.sensorService.getSensorTypes(),
      zigbeeDevices: this.zigbeeService.getDevices().pipe(catchError(() => of([]))),
      zones: this.zoneService.getZones(),
      areas: this.areaService.getAreas(),
      boardVersion: this.monitoringService.getBoardVersion()
    })
      .pipe(finalize(() => this.loader.display(false)))
      .subscribe(results => {
        this.sensors = results.sensors.sort((a, b) => a.uiOrder - b.uiOrder)
        this.sensorTypes = results.sensorTypes
        this.zigbeeDevicesById = new Map(
          results.zigbeeDevices.map(device => [device.id, device] as [number, ZigbeeDevice])
        )
        this.zones = results.zones
        this.areas = results.areas
        this.boardVersion = results.boardVersion
        this.sensorAttributeGroupsById = this.buildSensorAttributeGroups(this.sensors)

        this.loader.display(false)
        this.loader.disable(false)
      })
  }

  getZoneName(zoneId: number) {
    if (this.zones.length && zoneId != null) {
      return this.zones.find(x => x.id === zoneId)?.name
    }

    return ""
  }

  getAreaName(areaId: number) {
    if (this.areas.length && areaId != null) {
      return this.areas.find(x => x.id === areaId)?.name
    }

    return ""
  }

  getSensorTypeName(sensorTypeId: number) {
    if (this.sensorTypes.length) {
      return this.sensorTypes.find(x => x.id === sensorTypeId)?.name ?? ""
    }

    return ""
  }

  getSensorAttributes(sensor: Sensor) {
    const attributes: SensorAttribute[] = []

    // Sensor type
    const sensorTypeName = this.getSensorTypeName(sensor.typeId)
    attributes.push({
      icon: SensorType.getIconName(sensorTypeName),
      content: SensorType.getLabel(sensorTypeName)
    })

    // Channel
    const zigbeeDevice =
      sensor.zigbeeDeviceId != null ? this.zigbeeDevicesById.get(sensor.zigbeeDeviceId) : undefined

    attributes.push({
      icon: sensor.zigbeeDeviceId != null ? "wifi" : "label",
      content:
        zigbeeDevice?.name ||
        zigbeeDevice?.ieeeAddress ||
        (sensor.channel !== -1 ? `CH${(sensor.channel + 1).toString().padStart(2, "0")}` : "-")
    })

    // Channel type (only for board version >= 3)
    if (this.boardVersion >= 3) {
      attributes.push({
        icon: "device_hub",
        content: this.getChannelTypeLabel(sensor.channelType)
      })

      // Contact type
      attributes.push({
        icon: "toggle_on",
        content: this.getContactTypeLabel(sensor.sensorContactType)
      })

      // EOL count
      attributes.push({
        icon: "square",
        content: this.getEOLCountLabel(sensor.sensorEolCount)
      })
    }

    // Area
    attributes.push({
      icon: "crop",
      content: this.getAreaName(sensor.areaId)
    })

    // Zone
    attributes.push({
      icon: "rectangle",
      content: sensor.channel !== -1 ? this.getZoneName(sensor.zoneId) : "-"
    })

    // Silent alert
    attributes.push({
      icon: sensor.silentAlert ? "volume_mute" : "volume_up",
      content: this.getSilentAlertLabel(sensor.silentAlert)
    })

    // Monitor settings
    attributes.push({
      icon: "tune",
      content: this.getMonitorSettingsLabel(sensor.monitorPeriod, sensor.monitorThreshold)
    })

    // Enabled status
    attributes.push({
      icon: sensor.enabled ? "check_circle" : "circle",
      iconClass: sensor.enabled ? "sensor-status-icon-enabled" : "",
      content: sensor.enabled
        ? $localize`:@@sensor enabled:Enabled`
        : $localize`:@@sensor disable:Disabled`
    })

    // Visibility
    attributes.push({
      icon: sensor.uiHidden ? "visibility_off" : "visibility",
      iconClass: sensor.uiHidden ? "sensor-status-icon-hide" : "sensor-status-icon-show",
      content: sensor.uiHidden
        ? $localize`:@@sensor hidden:Hidden`
        : $localize`:@@sensor visible:Visible`
    })

    return attributes
  }

  getSensorAttributeGroups(sensor: Sensor) {
    const attributes = this.getSensorAttributes(sensor)
    const groupSize = Math.ceil(attributes.length / 2)

    return [attributes.slice(0, groupSize), attributes.slice(groupSize)]
  }

  getSensorAttributeGroupsById(sensorId: number): SensorAttribute[][] {
    return this.sensorAttributeGroupsById.get(sensorId) ?? []
  }

  private buildSensorAttributeGroups(sensors: Sensor[]): Map<number, SensorAttribute[][]> {
    const groupsById = new Map<number, SensorAttribute[][]>()
    sensors.forEach(sensor => {
      groupsById.set(sensor.id, this.getSensorAttributeGroups(sensor))
    })
    return groupsById
  }

  private getChannelTypeLabel(channelType: ChannelTypes): string {
    switch (channelType) {
      case ChannelTypes.BASIC:
        return $localize`:@@sensor channel basic:Basic`
      case ChannelTypes.NORMAL:
        return $localize`:@@sensor channel normal:Normal`
      case ChannelTypes.CHANNEL_A:
        return $localize`:@@sensor channel a:Channel A`
      case ChannelTypes.CHANNEL_B:
        return $localize`:@@sensor channel b:Channel B`
      default:
        return ""
    }
  }

  private getContactTypeLabel(contactType: SensorContactTypes): string {
    switch (contactType) {
      case SensorContactTypes.NC:
        return $localize`:@@sensor contact nc: Normally Closed (NC) `
      case SensorContactTypes.NO:
        return $localize`:@@sensor contact no: Normally Open (NO) `
      default:
        return ""
    }
  }

  private getEOLCountLabel(eolCount: SensorEOLCount): string {
    switch (eolCount) {
      case SensorEOLCount.SINGLE:
        return $localize`:@@sensor eol single:Single EOL`
      case SensorEOLCount.DOUBLE:
        return $localize`:@@sensor eol double:Double EOL`
      default:
        return ""
    }
  }

  private getSilentAlertLabel(silentAlert: boolean | null): string {
    if (silentAlert === false) return $localize`:@@sensor silent syren:Alarm with syren`
    if (silentAlert === true) return $localize`:@@sensor silent alert:Silent alert`
    return "-"
  }

  private getMonitorSettingsLabel(
    monitorPeriod: number | null,
    monitorThreshold: number | null
  ): string {
    if (monitorPeriod != null) {
      return `${monitorPeriod !== null ? monitorPeriod + "s" : "-"}/${monitorThreshold}%`
    }
    if (monitorPeriod === null && monitorThreshold != null) {
      return $localize`:@@sensor instant:Instant alert`
    }
    return "-"
  }

  userCanEdit() {
    return this.authService.getRole() === "admin"
  }

  openDeleteDialog(sensorId: number) {
    const sensor = this.sensors.find(x => x.id === sensorId)
    const dialogRef = this.dialog.open(QuestionDialogComponent, {
      width: "450px",
      data: {
        title: $localize`:@@delete sensor:Delete Sensor`,
        message: $localize`:@@delete sensor message:Are you sure you want to delete the sensor "${sensor.description}"?`,
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
      if (result === "ok") {
        if (this.monitoringState === MONITORING_STATE.READY) {
          this.loader.disable(true)
          this.sensorService
            .deleteSensor(sensorId)
            .pipe(finalize(() => this.loader.disable(false)))
            .subscribe({
              next: _ => {
                this.snackBar.open($localize`:@@sensor deleted:Sensor deleted!`, null, {
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

  onResetReferences(sensorId: number = null) {
    if (sensorId) {
      this.sensorService.resetReference(sensorId)
    } else {
      this.sensorService.resetReferences()
    }
  }

  onDragStarted(event: CdkDragStart<string[]>) {
    this.isDragging = true
  }

  onDrop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.sensors, event.previousIndex, event.currentIndex)
    this.sensors.forEach((sensor, index) => {
      sensor.uiOrder = index
    })

    this.sensorService.reorder(this.sensors)
    this.isDragging = false
    // delayed update
    setTimeout(() => this.updateComponent(), 500)
  }
}
