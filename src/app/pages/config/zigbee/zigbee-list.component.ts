import { Component, Inject, OnDestroy, OnInit } from "@angular/core"
import { forkJoin, of } from "rxjs"

import { MatDialog } from "@angular/material/dialog"
import { MatSnackBar } from "@angular/material/snack-bar"
import { catchError, finalize } from "rxjs/operators"

import { QuestionDialogComponent } from "@app/components/question-dialog/question-dialog.component"
import { ConfigurationBaseComponent } from "@app/configuration-base/configuration-base.component"
import { MONITORING_STATE, Sensor, ZigbeeDevice, zigbeeZoneTypeLabel } from "@app/models"
import {
  AuthenticationService,
  EventService,
  LoaderService,
  MonitoringService,
  SensorService,
  ZigbeeService
} from "@app/services"
import { AUTHENTICATION_SERVICE } from "@app/tokens"
import { environment } from "@environments/environment"
import { IAS_ZONE_TYPE, OCCUPANCY_SENSOR_TYPE } from "./consts"

const scheduleMicrotask = Promise.resolve(null)
const dayInMilliseconds = 24 * 60 * 60 * 1000

type AttributeSeverity = "warn" | "alert"

interface ZigbeeAttribute {
  icon: string
  label: string
  values?: string[]
  linkedSensors?: Sensor[]
  severity?: AttributeSeverity
}

@Component({
  templateUrl: "zigbee-list.component.html",
  styleUrls: ["zigbee-list.component.scss"],
  providers: [],
  standalone: false
})
export class ZigbeeListComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  devices: ZigbeeDevice[] | null = null
  sensors: Sensor[] = []
  zigbeeSupported = true
  isPairing = false
  pairingTimeLeft = 0
  progress = 0.0
  deviceAttributeGroupsById = new Map<number, ZigbeeAttribute[][]>()

  constructor(
    @Inject(AUTHENTICATION_SERVICE) public authService: AuthenticationService,
    @Inject("EventService") public eventService: EventService,
    @Inject("LoaderService") public loader: LoaderService,
    @Inject("MonitoringService") public monitoringService: MonitoringService,
    @Inject("ZigbeeService") private zigbeeService: ZigbeeService,
    @Inject("SensorService") private sensorService: SensorService,

    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    super(eventService, loader, monitoringService)
  }

  ngOnInit() {
    super.initialize()
    this.editableStates.push(MONITORING_STATE.INVALID_CONFIG)

    this.baseSubscriptions.push(
      this.eventService.listen("zigbee_pairing_state_change").subscribe({
        next: pairing_state => {
          this.isPairing = pairing_state.state
          this.pairingTimeLeft = parseInt(pairing_state.remain_seconds, 10)
          this.progress = parseFloat(pairing_state.progress)
          if (!this.isPairing) {
            this.updateComponent()
          }
        }
      })
    )

    this.baseSubscriptions.push(
      this.eventService.listen("zigbee_state_change").subscribe({
        next: () => {
          this.updateComponent()
        }
      })
    )

    scheduleMicrotask.then(() => {
      this.loader.display(true)
    })
    this.updateComponent()
  }

  ngOnDestroy() {
    super.destroy()
  }

  updateComponent() {
    forkJoin({
      devices: this.zigbeeService.getDevices(),
      sensors: this.sensorService.getSensors().pipe(catchError(() => of([] as Sensor[])))
    })
      .pipe(finalize(() => this.loader.display(false)))
      .subscribe({
        next: ({ devices, sensors }) => {
          this.zigbeeSupported = true
          this.sensors = sensors
          this.devices = devices.sort((a, b) =>
            (a.name || a.ieeeAddress).localeCompare(b.name || b.ieeeAddress)
          )
          this.deviceAttributeGroupsById = this.buildDeviceAttributeGroups(this.devices)
          this.loader.display(false)
          this.loader.disable(false)
        },
        error: error => {
          this.zigbeeSupported = error.status !== 404
          this.devices = []
          this.sensors = []
          this.loader.display(false)
          this.loader.disable(false)
        }
      })
  }

  getDeviceAttributes(device: ZigbeeDevice): ZigbeeAttribute[] {
    const attributes: ZigbeeAttribute[] = []
    const linkedSensors = this.sensors.filter(sensor => sensor.zigbeeDeviceId === device.id)

    // IEEE Address
    attributes.push({
      icon: "fingerprint",
      label: $localize`:@@zigbee ieee:IEEE Address`,
      values: [device.ieeeAddress]
    })

    // Network Address
    attributes.push({
      icon: "tag",
      label: $localize`:@@zigbee nwk:Network Address`,
      values: [
        device.networkAddress != null
          ? `0x${device.networkAddress.toString(16).toUpperCase().padStart(4, "0")}`
          : "-"
      ]
    })

    // Model & Manufacturer
    attributes.push({
      icon: "devices_other",
      label: $localize`:@@zigbee model:Model`,
      values: [[device.manufacturer, device.model].filter(Boolean).join(" ") || "-"]
    })

    const sensorTypes = new Map<string, string>()
    for (const signal of device.metadata?.signals ?? []) {
      let sensorType: string
      if (signal.clusterId === IAS_ZONE_TYPE) {
        sensorType = zigbeeZoneTypeLabel(signal.zoneType)
      } else if (signal.clusterId === OCCUPANCY_SENSOR_TYPE) {
        sensorType = $localize`:@@zigbee occupancy sensor:Occupancy sensor`
      } else {
        continue
      }

      const key = `${signal.endpoint}:${signal.clusterId}`
      sensorTypes.set(key, `${sensorType}`)
    }
    attributes.push({
      icon: "sensors",
      label: $localize`:@@zigbee sensor type:Sensor Type`,
      values: [...sensorTypes.values()]
    })

    // Connected Sensor
    attributes.push({
      icon: "sensors",
      label: $localize`:@@zigbee connected sensors:Sensor`,
      values: linkedSensors.length === 0 ? [$localize`:@@zigbee no sensors:None`] : [],
      linkedSensors
    })

    // Battery
    attributes.push({
      icon: "battery_std",
      label: $localize`:@@zigbee battery:Battery`,
      values: [device.batteryLevel != null ? `${device.batteryLevel}%` : "-"],
      severity: this.getBatterySeverity(device.batteryLevel)
    })

    // Signal Quality (LQI)
    attributes.push({
      icon: "network_check",
      label: $localize`:@@zigbee signal:Link Quality`,
      values: [device.signalQuality != null ? `${device.signalQuality} LQI` : "-"],
      severity: this.getSignalSeverity(device.signalQuality)
    })

    // Last Seen
    attributes.push({
      icon: "schedule",
      label: $localize`:@@zigbee last seen:Last Seen`,
      values: [this.formatDate(device.lastSeen)],
      severity: this.getLastSeenSeverity(device.lastSeen)
    })

    return attributes
  }

  getDeviceAttributeGroups(device: ZigbeeDevice): ZigbeeAttribute[][] {
    const attributes = this.getDeviceAttributes(device)
    const groupSize = Math.ceil(attributes.length / 2)
    return [attributes.slice(0, groupSize), attributes.slice(groupSize)]
  }

  getDeviceAttributeGroupsById(deviceId: number): ZigbeeAttribute[][] {
    return this.deviceAttributeGroupsById.get(deviceId) ?? []
  }

  private buildDeviceAttributeGroups(devices: ZigbeeDevice[]): Map<number, ZigbeeAttribute[][]> {
    const groupsById = new Map<number, ZigbeeAttribute[][]>()
    devices.forEach(device => {
      groupsById.set(device.id, this.getDeviceAttributeGroups(device))
    })
    return groupsById
  }

  formatDate(dateString?: string): string {
    if (!dateString) return "-"
    try {
      const date = new Date(dateString)
      return isNaN(date.getTime()) ? dateString : date.toLocaleString()
    } catch {
      return dateString
    }
  }

  private getBatterySeverity(batteryLevel?: number): AttributeSeverity | undefined {
    if (batteryLevel == null) return undefined
    if (batteryLevel < 20) return "alert"
    if (batteryLevel < 50) return "warn"
    return undefined
  }

  private getSignalSeverity(signalQuality?: number): AttributeSeverity | undefined {
    if (signalQuality == null) return undefined
    if (signalQuality < 50) return "alert"
    if (signalQuality < 100) return "warn"
    return undefined
  }

  private getLastSeenSeverity(dateString?: string): AttributeSeverity | undefined {
    if (!dateString) return undefined
    const lastSeen = new Date(dateString).getTime()
    if (isNaN(lastSeen)) return undefined

    const daysSinceSeen = (Date.now() - lastSeen) / dayInMilliseconds
    if (daysSinceSeen > 7) return "alert"
    if (daysSinceSeen > 1) return "warn"
    return undefined
  }

  userCanEdit(): boolean {
    return this.authService.getRole() === "admin"
  }

  canPair(): boolean {
    return this.userCanEdit() && this.monitoringState === MONITORING_STATE.READY
  }

  canDelete(device: ZigbeeDevice): boolean {
    return (
      this.userCanEdit() &&
      (!device.sensorCount || device.sensorCount === 0) &&
      [this.monitoringStates.READY, this.monitoringStates.INVALID_CONFIG].includes(
        this.monitoringState
      )
    )
  }

  onPairing() {
    this.loader.display(true)
    this.zigbeeService
      .pair()
      .pipe(finalize(() => this.loader.display(false)))
      .subscribe({
        next: _ => {
          this.snackBar.open(
            $localize`:@@zigbee pairing started:Zigbee pairing enabled for 60 seconds! Put your device into pairing mode.`,
            null,
            {
              duration: environment.snackDuration
            }
          )
        },
        error: _ => {
          this.snackBar.open(
            $localize`:@@zigbee pairing failed:Failed to start Zigbee pairing!`,
            null,
            {
              duration: environment.snackDuration
            }
          )
        }
      })
  }

  openDeleteDialog(deviceId: number) {
    const device = this.devices.find(x => x.id === deviceId)
    if (!device) return

    if (device.sensorCount && device.sensorCount > 0) {
      this.snackBar.open(
        $localize`:@@zigbee cant delete connected:Cannot delete device connected to ${device.sensorCount} sensor(s)!`,
        null,
        {
          duration: environment.snackDuration
        }
      )
      return
    }

    const dialogRef = this.dialog.open(QuestionDialogComponent, {
      width: "450px",
      data: {
        title: $localize`:@@delete zigbee device:Delete Zigbee Device`,
        message: $localize`:@@delete zigbee device message:Are you sure you want to delete the device "${device.name || device.ieeeAddress}"?`,
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
        if (
          [this.monitoringStates.READY, this.monitoringStates.INVALID_CONFIG].includes(
            this.monitoringState
          )
        ) {
          this.loader.disable(true)
          this.zigbeeService
            .deleteDevice(deviceId)
            .pipe(finalize(() => this.loader.disable(false)))
            .subscribe({
              next: _ => {
                this.snackBar.open(
                  $localize`:@@zigbee device deleted:Zigbee device deleted!`,
                  null,
                  {
                    duration: environment.snackDuration
                  }
                )
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
}
