import { Component, Inject, OnDestroy, OnInit } from "@angular/core"
import { FormBuilder, FormGroup, Validators } from "@angular/forms"
import { ActivatedRoute, Router } from "@angular/router"

import { MatSnackBar } from "@angular/material/snack-bar"
import { finalize } from "rxjs/operators"

import { ConfigurationBaseComponent } from "@app/configuration-base/configuration-base.component"
import { MONITORING_STATE, ZigbeeDevice, zigbeeZoneTypeLabel } from "@app/models"
import { EventService, LoaderService, MonitoringService, ZigbeeService } from "@app/services"
import { environment } from "@environments/environment"

import { IAS_ZONE_TYPE, OCCUPANCY_SENSOR_TYPE } from "./consts"

@Component({
  templateUrl: "zigbee-device-detail.component.html",
  styleUrls: ["zigbee-device-detail.component.scss"],
  providers: [],
  standalone: false
})
export class ZigbeeDeviceDetailComponent
  extends ConfigurationBaseComponent
  implements OnInit, OnDestroy
{
  device: ZigbeeDevice | null = undefined
  deviceForm: FormGroup

  constructor(
    @Inject("EventService") public eventService: EventService,
    @Inject("LoaderService") public loader: LoaderService,
    @Inject("MonitoringService") public monitoringService: MonitoringService,
    @Inject("ZigbeeService") private zigbeeService: ZigbeeService,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    super(eventService, loader, monitoringService)
  }

  ngOnInit() {
    super.initialize()
    this.editableStates.push(MONITORING_STATE.INVALID_CONFIG)

    const deviceId = Number(this.route.snapshot.paramMap.get("id"))
    if (!Number.isSafeInteger(deviceId) || deviceId <= 0) {
      this.device = null
      return
    }

    this.loader.display(true)
    this.zigbeeService
      .getDevice(deviceId)
      .pipe(finalize(() => this.loader.display(false)))
      .subscribe({
        next: device => {
          this.device = device
          this.deviceForm = this.formBuilder.group({
            name: [device.name ?? "", [Validators.required, Validators.maxLength(12)]]
          })
        },
        error: error => {
          this.device = null
          if (error.status !== 404) {
            this.snackBar.open(
              $localize`:@@zigbee device load failed:Failed to load Zigbee device!`,
              null,
              {
                duration: environment.snackDuration
              }
            )
          }
        }
      })
  }

  ngOnDestroy() {
    super.destroy()
  }

  get deviceSubtitle(): string {
    if (!this.device) {
      return ""
    }

    const sensorTypes = new Map<string, string>()
    for (const signal of this.device.metadata?.signals ?? []) {
      let sensorType: string
      if (signal.clusterId === IAS_ZONE_TYPE) {
        sensorType = zigbeeZoneTypeLabel(signal.zoneType)
      } else if (signal.clusterId === OCCUPANCY_SENSOR_TYPE) {
        sensorType = $localize`:@@zigbee occupancy sensor:Occupancy sensor`
      } else {
        continue
      }

      sensorTypes.set(
        `${signal.endpoint}:${signal.clusterId}`,
        `${sensorType} (endpoint ${signal.endpoint})`
      )
    }

    return [this.device.manufacturer, ...sensorTypes.values()].filter(Boolean).join(" | ")
  }

  onSubmit() {
    if (
      !this.device ||
      !this.deviceForm.valid ||
      ![MONITORING_STATE.READY, MONITORING_STATE.INVALID_CONFIG].includes(this.monitoringState)
    ) {
      return
    }

    this.loader.disable(true)
    this.zigbeeService
      .updateDevice({ id: this.device.id, name: this.deviceForm.controls.name.value })
      .pipe(finalize(() => this.loader.disable(false)))
      .subscribe({
        next: () => {
          this.snackBar.open(
            $localize`:@@zigbee device updated:Zigbee device name updated!`,
            null,
            {
              duration: environment.snackDuration
            }
          )
          this.router.navigate(["/config/zigbee"])
        },
        error: () =>
          this.snackBar.open(
            $localize`:@@zigbee device update failed:Failed to update Zigbee device name!`,
            null,
            {
              duration: environment.snackDuration
            }
          )
      })
  }

  onCancel() {
    this.router.navigate(["/config/zigbee"])
  }
}
