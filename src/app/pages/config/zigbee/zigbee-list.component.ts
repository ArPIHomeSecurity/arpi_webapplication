import { Component, Inject, OnDestroy, OnInit } from "@angular/core"

import { MatDialog } from "@angular/material/dialog"
import { MatSnackBar } from "@angular/material/snack-bar"
import { finalize } from "rxjs/operators"

import { QuestionDialogComponent } from "@app/components/question-dialog/question-dialog.component"
import { ConfigurationBaseComponent } from "@app/configuration-base/configuration-base.component"
import { MONITORING_STATE, ZigbeeDevice } from "@app/models"
import {
  AuthenticationService,
  EventService,
  LoaderService,
  MonitoringService,
  ZigbeeService
} from "@app/services"
import { AUTHENTICATION_SERVICE } from "@app/tokens"
import { environment } from "@environments/environment"

const scheduleMicrotask = Promise.resolve(null)

interface ZigbeeAttribute {
  icon: string
  label: string
  value: string
  iconClass?: string
}

@Component({
  templateUrl: "zigbee-list.component.html",
  styleUrls: ["zigbee-list.component.scss"],
  providers: [],
  standalone: false
})
export class ZigbeeListComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  devices: ZigbeeDevice[] | null = null
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

    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    super(eventService, loader, monitoringService)
  }

  ngOnInit() {
    super.initialize()
    this.editableStates.push(MONITORING_STATE.INVALID_CONFIG)

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

    scheduleMicrotask.then(() => {
      this.loader.display(true)
    })
    this.updateComponent()
  }

  ngOnDestroy() {
    super.destroy()
  }

  updateComponent() {
    this.zigbeeService
      .getDevices()
      .pipe(finalize(() => this.loader.display(false)))
      .subscribe({
        next: devices => {
          this.zigbeeSupported = true
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
          this.loader.display(false)
          this.loader.disable(false)
        }
      })
  }

  getDeviceAttributes(device: ZigbeeDevice): ZigbeeAttribute[] {
    const attributes: ZigbeeAttribute[] = []

    // IEEE Address
    attributes.push({
      icon: "fingerprint",
      label: $localize`:@@zigbee ieee:IEEE Address`,
      value: device.ieeeAddress
    })

    // Network Address
    attributes.push({
      icon: "tag",
      label: $localize`:@@zigbee nwk:Network Address`,
      value:
        device.networkAddress != null
          ? `0x${device.networkAddress.toString(16).toUpperCase().padStart(4, "0")}`
          : "-"
    })

    // Model & Manufacturer
    attributes.push({
      icon: "devices_other",
      label: $localize`:@@zigbee model:Model`,
      value: [device.manufacturer, device.model].filter(Boolean).join(" ") || "-"
    })

    // Availability / Status
    const isOnline = device.availability === "online"
    const isOffline = device.availability === "offline"
    attributes.push({
      icon: isOnline ? "wifi" : isOffline ? "wifi_off" : "help_outline",
      label: $localize`:@@zigbee status:Status`,
      value: isOnline
        ? $localize`:@@zigbee online:Online`
        : isOffline
          ? $localize`:@@zigbee offline:Offline`
          : $localize`:@@zigbee unknown:Unknown`,
      iconClass: isOnline ? "zigbee-status-online" : isOffline ? "zigbee-status-offline" : ""
    })

    // Battery
    attributes.push({
      icon: "battery_std",
      label: $localize`:@@zigbee battery:Battery`,
      value: device.batteryLevel != null ? `${device.batteryLevel * 100}%` : "-"
    })

    // Signal Quality (LQI)
    attributes.push({
      icon: "network_check",
      label: $localize`:@@zigbee signal:Link Quality`,
      value: device.signalQuality != null ? `${device.signalQuality} LQI` : "-"
    })

    // Connected Sensors
    attributes.push({
      icon: "sensors",
      label: $localize`:@@zigbee connected sensors:Sensors`,
      value:
        device.sensorCount != null && device.sensorCount > 0
          ? $localize`:@@zigbee sensor count:${device.sensorCount} sensor(s)`
          : $localize`:@@zigbee no sensors:None`
    })

    // Last Seen
    attributes.push({
      icon: "schedule",
      label: $localize`:@@zigbee last seen:Last Seen`,
      value: this.formatDate(device.lastSeen)
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

  formatDate(dateString: string): string {
    if (!dateString) return "-"
    try {
      const date = new Date(dateString)
      return isNaN(date.getTime()) ? dateString : date.toLocaleString()
    } catch {
      return dateString
    }
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
