import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, Inject } from '@angular/core';
import { UntypedFormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { forkJoin, of, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { ConfigurationBaseComponent } from '@app/configuration-base/configuration-base.component';
import { QuestionDialogComponent } from '@app/components/question-dialog/question-dialog.component';
import { ARM_TYPE, Area, MONITORING_STATE, Sensor, SensorType, Zone, string2MonitoringState } from '@app/models';
import { AreaService, EventService, LoaderService, MonitoringService, SensorService, ZoneService } from '@app/services';
import { positiveInteger } from '@app/utils';

import { environment } from '@environments/environment';

const scheduleMicrotask = Promise.resolve(null);

/**
 * Channel info
 */
class Channel {
  channel: number;
  sensor: Sensor;
}

/**
 * Helper class for storing sensor and zone information.
 */
class SensorInfo {
  channel: number;
  typeId: number;
  zoneId: number;
  enabled: boolean;
  description: string;

  zoneName: string;
  disarmedDelay: number;
  awayAlertDelay: number;
  stayAlertDelay: number;
}


@Component({
    templateUrl: './sensor-detail.component.html',
    styleUrls: ['sensor-detail.component.scss'],
    providers: [],
    standalone: false
})
export class SensorDetailComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {

  sensorId: number;
  sensor: Sensor = undefined;
  sensors: Sensor[];
  channels: Channel[];
  areas: Area[];
  zones: Zone[];
  sensorTypes: SensorType[];
  sensorForm: FormGroup;
  zoneForm: FormGroup;
  areaForm: FormGroup;
  newZone = false;
  monitoringStates = MONITORING_STATE;

  constructor(
    @Inject('EventService') public eventService: EventService,
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,
    @Inject('SensorService') private sensorService: SensorService,
    @Inject('ZoneService') private zoneService: ZoneService,
    @Inject('AreaService') private areaService: AreaService,

    public router: Router,

    private fb: UntypedFormBuilder,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    super(eventService, loader, monitoringService);

    this.route.paramMap.subscribe(params => {
      if (params.get('id') != null) {
        this.sensorId = +params.get('id');
      }
    });
  }

  ngOnInit() {
    super.initialize();
    this.editableStates.push(MONITORING_STATE.INVALID_CONFIG);

    // avoid ExpressionChangedAfterItHasBeenCheckedError
    // https://github.com/angular/angular/issues/17572#issuecomment-323465737
    scheduleMicrotask.then(() => {
      this.loader.display(true);
    });

    this.baseSubscriptions.push(
      this.eventService.listen('system_state_change')
        .subscribe(monitoringState => this.monitoringState = string2MonitoringState(monitoringState))
    );

    if (this.sensorId != null) {
      forkJoin({
        sensor: this.sensorService.getSensor(this.sensorId),
        sensors: this.sensorService.getSensors(),
        zones: this.zoneService.getZones(),
        areas: this.areaService.getAreas(),
        sensorTypes: this.sensorService.getSensorTypes()
      })
        .pipe(
          catchError((error) => {
            if (error.status === 404) {
              this.sensor = null;
            }
            return throwError(() => error);
          }),
          finalize(() => this.loader.display(false))
        )
        .subscribe(results => {
          this.sensor = results.sensor;
          this.sensors = results.sensors;
          this.zones = results.zones;
          this.areas = results.areas;
          this.sensorTypes = results.sensorTypes.sort((st1, st2) => st1.id > st2.id ? 1 : st1.id < st2.id ? -1 : 0);
          this.channels = this.generateChannels(this.sensors);

          this.updateForm(this.sensor);
          this.onZoneSelected(this.sensor.zoneId);
          this.onAreaSelected(this.sensor.areaId);
          this.loader.display(false);
        });
    } else {
      forkJoin({
        sensors: this.sensorService.getSensors(),
        sensorTypes: this.sensorService.getSensorTypes(),
        zones: this.zoneService.getZones(),
        areas: this.areaService.getAreas()
      })
        .pipe(finalize(() => this.loader.display(false)))
        .subscribe(results => {
          this.sensors = results.sensors;
          this.sensorTypes = results.sensorTypes;
          this.zones = results.zones;
          this.areas = results.areas;
          this.channels = this.generateChannels(this.sensors);

          this.sensor = new Sensor();
          this.sensor.enabled = true;
          const firstFreeChannel = this.channels.find(ch => (ch.sensor == null) && (ch.channel >= 0));
          this.sensor.channel = firstFreeChannel ? firstFreeChannel.channel : null;
          this.sensor.zoneId = -1;
          this.sensor.areaId = this.areas.length >= 1 ? this.areas[0].id : -1;;
          this.sensor.typeId = this.sensorTypes[0].id;
          this.sensor.uiHidden = false;

          this.updateForm(this.sensor);
          this.onZoneSelected(this.sensor.zoneId);
          this.onAreaSelected(this.sensor.areaId);
          this.loader.display(false);
        });
    }
  }

  ngOnDestroy() {
    super.destroy();
  }

  updateForm(sensor: Sensor) {
    // create zone form if new zone is selected (zoneId)
    this.zoneForm = this.fb.group({
      zoneName: new FormControl('', [Validators.required, Validators.maxLength(32)]),
      disarmedAlert: false,
      disarmedDelay: new FormControl(0),
      awayArmedAlert: true,
      awayAlertDelay: new FormControl(0, [Validators.required, positiveInteger()]),
      awayArmDelay: new FormControl(0, [Validators.required, positiveInteger()]),
      stayArmedAlert: true,
      stayAlertDelay: new FormControl(0, [Validators.required, positiveInteger()]),
      stayArmDelay: new FormControl(0, [Validators.required, positiveInteger()])
    });

    this.areaForm = this.fb.group({
      areaName: new FormControl('', [Validators.required, Validators.maxLength(32)]),
    });

    this.sensorForm = this.fb.group({
      channel: new FormControl(sensor.channel),
      zoneId: new FormControl(sensor.zoneId, Validators.required),
      areaId: new FormControl(sensor.areaId, Validators.required),
      typeId: new FormControl(sensor.typeId, Validators.required),
      enabled: sensor.enabled,
      silentAlert: new FormControl(),
      sensitivity: new FormControl(),
      monitorPeriod: new FormControl(sensor.monitorPeriod, [Validators.required, positiveInteger()]),
      monitorThreshold: new FormControl(sensor.monitorThreshold, [Validators.required, Validators.min(0), Validators.max(100), Validators.pattern(/^\d+$/)]),
      name: new FormControl(sensor.name, [Validators.required, Validators.maxLength(16)]),
      description: new FormControl(sensor.description),
      zoneForm: this.zoneForm,
      areaForm: this.areaForm,
      hidden: sensor.uiHidden
    });

    if (sensor.silentAlert == null) {
      this.sensorForm.controls.silentAlert.setValue('undefined');
    }
    else if (sensor.silentAlert === true) {
      this.sensorForm.controls.silentAlert.setValue('silent');
    }
    else if (sensor.silentAlert === false) {
      this.sensorForm.controls.silentAlert.setValue('loud');
    }

    if (sensor.monitorPeriod != null && sensor.monitorThreshold != null) {
      this.sensorForm.controls.sensitivity.setValue('custom');
      this.sensorForm.controls.monitorPeriod.setValidators([Validators.required, positiveInteger()]);
      this.sensorForm.controls.monitorPeriod.enable();
      this.sensorForm.controls.monitorThreshold.setValidators([Validators.required, positiveInteger()]);
      this.sensorForm.controls.monitorThreshold.enable();
    }
    else if (sensor.monitorPeriod == null && sensor.monitorThreshold != null) {
      this.sensorForm.controls.sensitivity.setValue('instant');
      this.sensorForm.controls.monitorPeriod.disable();
      this.sensorForm.controls.monitorPeriod.clearValidators();
      this.sensorForm.controls.monitorThreshold.disable();
      this.sensorForm.controls.monitorThreshold.clearValidators();
    }
    else {
      this.sensorForm.controls.sensitivity.setValue('undefined');
      this.sensorForm.controls.monitorPeriod.disable();
      this.sensorForm.controls.monitorPeriod.clearValidators();
      this.sensorForm.controls.monitorThreshold.disable();
      this.sensorForm.controls.monitorThreshold.clearValidators();
    }

    if (sensor.typeId === 2) {
      this.sensorForm.controls.sensitivity.setValue('instant');
      this.sensorForm.controls.sensitivity.disable();
    }
    else {
      this.sensorForm.controls.sensitivity.enable();
    }
  }

  onSensorTypeChanged(event) {
    if (event.value === 2) {
      this.sensorForm.controls.sensitivity.setValue('instant');
      this.sensorForm.controls.sensitivity.disable();
    }
    else {
      this.sensorForm.controls.sensitivity.enable();
    }
  }

  onSensitivityChanged(event) {
    if (event.value === 'custom') {
      this.sensorForm.controls.monitorPeriod.setValidators([Validators.required, positiveInteger()]);
      this.sensorForm.controls.monitorPeriod.enable();
      this.sensorForm.controls.monitorThreshold.setValidators([Validators.required, positiveInteger()]);
      this.sensorForm.controls.monitorThreshold.enable();
    }
    else {
      this.sensorForm.controls.monitorPeriod.clearValidators();
      this.sensorForm.controls.monitorPeriod.setErrors(null);
      this.sensorForm.controls.monitorPeriod.setValue(null);
      this.sensorForm.controls.monitorPeriod.disable();
      this.sensorForm.controls.monitorThreshold.clearValidators();
      this.sensorForm.controls.monitorThreshold.setErrors(null);
      this.sensorForm.controls.monitorThreshold.setValue(null);
      this.sensorForm.controls.monitorThreshold.disable();
    }
  }

  onSubmit() {
    const sensor = this.prepareSensor();
    const zone = this.prepareZone();
    const area = this.prepareArea();

    if (sensor.channel >= 0 && this.channels[sensor.channel].sensor != null && sensor.id !== this.channels[sensor.channel].sensor.id) {
      // disconnect sensor on channel collision
      this.channels[sensor.channel].sensor.channel = -1;
      this.sensorService.updateSensor(this.channels[sensor.channel].sensor);
    }

    if (this.sensor.zoneId === -1 || this.sensor.areaId === -1) {
      forkJoin({
        resultZone: this.sensor.zoneId === -1 ? this.zoneService.createZone(zone) : of(null),
        resultArea: this.sensor.areaId === -1 ? this.areaService.createArea(area) : of(null)
      })
        .subscribe({
          next: results => {
            if (results.resultZone) {
              sensor.zoneId = results.resultZone.id;
            }
            if (results.resultArea) {
              sensor.areaId = results.resultArea.id;
            }

            if (this.sensor.id !== undefined) {
              return this.sensorService.updateSensor(sensor)
                .subscribe(_ => this.router.navigate(['/sensors']));
            }

            return this.sensorService.createSensor(sensor)
              .subscribe(_ => this.router.navigate(['/sensors']));
          },
          error: _ => this.snackBar.open($localize`:@@failed create:Failed to create!`, null, { duration: environment.snackDuration })
        });
    }
    else if (this.sensorId != null) {
      this.sensorService.updateSensor(sensor)
        .subscribe({
          next: () => this.router.navigate(['/sensors']),
          error: () => this.snackBar.open($localize`:@@failed update:Failed to update!`, null, { duration: environment.snackDuration })
        });
    }
    else {
      this.sensorService.createSensor(sensor)
        .subscribe({
          next: () => this.router.navigate(['/sensors']),
          error: () => this.snackBar.open($localize`:@@failed create:Failed to create!`, null, { duration: environment.snackDuration })
        });
    }
  }

  onCancel() {
    this.router.navigate(['/sensors']);
  }

  prepareSensor(): Sensor {
    const formModel = this.sensorForm.value;

    var silentAlert = null;
    if (formModel.silentAlert === 'undefined') {
      silentAlert = null;
    }
    else if (formModel.silentAlert === 'loud') {
      silentAlert = false;
    }
    else if (formModel.silentAlert === 'silent') {
      silentAlert = true;
    }

    if (formModel.sensitivity === 'undefined') {
      formModel.monitorPeriod = null;
      formModel.monitorThreshold = null;
    }
    else if (formModel.sensitivity === 'instant') {
      formModel.monitorPeriod = null;
      formModel.monitorThreshold = 100;
    }

    return {
      id: this.sensor.id,
      name: formModel.name,
      description: formModel.description,
      channel: formModel.channel,
      areaId: formModel.areaId,
      zoneId: formModel.zoneId,
      typeId: formModel.typeId,
      alert: false,
      enabled: formModel.enabled,
      silentAlert: silentAlert,
      monitorPeriod: formModel.monitorPeriod,
      monitorThreshold: formModel.monitorThreshold,
      uiOrder: null,
      uiHidden: formModel.hidden
    };
  }

  getZoneName(): string {
    const zone = this.zones.find(zone => zone.id === this.sensor.zoneId);
    return zone ? zone.name : this.zoneForm.value.zoneName;
  }

  prepareZone(): Zone {
    const sensorModel = this.sensorForm.value;
    const zoneModel = this.zoneForm.value;

    return {
      id: sensorModel.zoneId,
      name: zoneModel.zoneName,
      description: zoneModel.zoneName,
      disarmedDelay: zoneModel.disarmedAlert ? parseInt(zoneModel.disarmedDelay, 10) : null,
      awayAlertDelay: zoneModel.awayArmedAlert ? parseInt(zoneModel.awayAlertDelay, 10) : null,
      awayArmDelay: zoneModel.awayArmedAlert ? parseInt(zoneModel.awayArmDelay, 10) : null,
      stayAlertDelay: zoneModel.stayArmedAlert ? parseInt(zoneModel.stayAlertDelay, 10) : null,
      stayArmDelay: zoneModel.stayArmedAlert ? parseInt(zoneModel.stayArmDelay, 10) : null,
      uiOrder: null
    };
  }

  getAreaName(): string {
    const area = this.areas.find(area => area.id === this.sensor.areaId);
    return area ? area.name : this.areaForm.value.areaName;
  }

  prepareArea(): Area {
    const sensorModel = this.sensorForm.value;
    const areaModel = this.areaForm.value;

    return {
      id: sensorModel.areaId,
      name: areaModel.areaName,
      armState: ARM_TYPE.DISARMED,
      uiOrder: null
    };
  }

  onZoneSelected(zoneId: number) {
    this.sensor.zoneId = zoneId;
    const controls = this.zoneForm.controls;

    // if NEW zone selected
    if (this.sensor.zoneId === -1) {
      controls.disarmedDelay.setValidators([Validators.required, positiveInteger()]);
      controls.awayAlertDelay.setValidators([Validators.required, positiveInteger()]);
      controls.stayAlertDelay.setValidators([Validators.required, positiveInteger()]);
      controls.zoneName.setValidators(Validators.required);
    } else {
      controls.zoneName.clearValidators();
      controls.zoneName.setErrors(null);
      controls.disarmedDelay.clearValidators();
      controls.disarmedDelay.setErrors(null);
      controls.awayAlertDelay.clearValidators();
      controls.awayAlertDelay.setErrors(null);
      controls.stayAlertDelay.clearValidators();
      controls.stayAlertDelay.setErrors(null);
    }

    this.zoneForm.updateValueAndValidity();
    this.sensorForm.updateValueAndValidity();
  }

  onAreaSelected(areaId: number) {
    this.sensor.areaId = areaId;
    const { controls } = this.areaForm;

    // if NEW area selected
    if (this.sensor.areaId === -1) {
      controls.areaName.setValidators(Validators.required);
    } else {
      controls.areaName.clearValidators();
      controls.areaName.setErrors(null);
    }

    this.areaForm.updateValueAndValidity();
    this.sensorForm.updateValueAndValidity();
  }

  alertWhenChanged(event, delayName) {
    const { controls } = this.zoneForm;
    if (event.checked) {
      controls[delayName].setValidators([Validators.required, positiveInteger()]);
    } else {
      controls[delayName].clearValidators();
      controls[delayName].setErrors(null);
    }

    controls[delayName].updateValueAndValidity();
  }

  openDeleteDialog(sensorId: number) {
    const sensor = this.sensors.find(x => x.id === sensorId);
    const dialogRef = this.dialog.open(QuestionDialogComponent, {
      width: '450px',
      data: {
        title: $localize`:@@delete sensor:Delete Sensor`,
        message: $localize`:@@delete sensor message:Are you sure you want to delete the sensor "${sensor.description}"?`,
        options: [
          {
            id: 'ok',
            text: $localize`:@@delete:Delete`,
            color: 'warn',
          },
          {
            id: 'cancel',
            text: $localize`:@@cancel:Cancel`
          }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'ok') {
        if (this.monitoringState === MONITORING_STATE.READY) {
          this.loader.disable(true);
          this.sensorService.deleteSensor(sensorId)
            .pipe(finalize(() => this.loader.disable(false)))
            .subscribe({
              next: _ => {
                this.snackBar.open($localize`:@@sensor deleted:Sensor deleted!`, null, { duration: environment.snackDuration });
                this.router.navigate(['/sensors'])
              },
              error: _ => this.snackBar.open($localize`:@@failed delete:Failed to delete!`, null, { duration: environment.snackDuration })
            });
        } else {
          this.snackBar.open($localize`:@@cant delete state:Cannot delete while not in READY state!`, null, { duration: environment.snackDuration });
        }
      }
    });
  }

  generateChannels(sensors: Sensor[]): Channel[] {
    // channels are numbered 1..channel count
    const channels: Channel[] = [];
    for (let channel = 0; channel < environment.channelCount; channel++) {
      const sensor = sensors.find(s => s.channel === channel);
      channels.push({
        channel,
        sensor
      });
    }

    channels.push({
      channel: -1,
      sensor: null
    });

    return channels;
  }

  orderedChannels(): Array<Channel> {
    return this.channels.concat().sort((ch1, ch2) => {
      if (ch1.channel > ch2.channel) {
        return 1;
      }
      if (ch1.channel < ch2.channel) {
        return -1;
      }
      return 0;
    });
  }
}
