import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, Inject } from '@angular/core';
import { Location } from '@angular/common';
import { UntypedFormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { forkJoin, of } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ConfigurationBaseComponent } from '../configuration-base/configuration-base.component';
import { SensorDeleteDialogComponent } from './sensor-delete.component';
import { ARM_TYPE, Area, MONITORING_STATE, Sensor, SensorType, Zone, string2MonitoringState } from '../models';
import { AreaService, EventService, LoaderService, MonitoringService, SensorService, ZoneService } from '../services';
import { positiveInteger } from '../utils';

import { environment } from '../../environments/environment';

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
  providers: []
})
export class SensorDetailComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  @ViewChild('snackbarTemplate') snackbarTemplate: TemplateRef<any>;
  action: string;

  sensorId: number;
  sensor: Sensor = null;
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
    private location: Location,
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
        .pipe(finalize(() => this.loader.display(false)))
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
      description: new FormControl(sensor.description, Validators.required),
      zoneForm: this.zoneForm,
      areaForm: this.areaForm,
      hidden: sensor.uiHidden
    });
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
      this.action = 'create';
      forkJoin({
        resultZone: this.sensor.zoneId === -1 ? this.zoneService.createZone(zone) : of(null),
        resultArea: this.sensor.areaId === -1 ? this.areaService.createArea(area) : of(null)
      })
        .subscribe(results => {
          if (results.resultZone) {
            sensor.zoneId = results.resultZone.id;
          }
          if (results.resultArea) {
            sensor.areaId = results.resultArea.id;
          }

          if (this.sensor.id !== undefined) {
            this.action = 'update';
            return this.sensorService.updateSensor(sensor)
              .subscribe(_ => this.router.navigate(['/sensors']));
          }

          return this.sensorService.createSensor(sensor)
            .subscribe(_ => this.router.navigate(['/sensors']));
        },
          _ => this.snackBar.openFromTemplate(this.snackbarTemplate, { duration: environment.snackDuration })
        );
    }
    else if (this.sensorId != null) {
      this.action = 'update';
      this.sensorService.updateSensor(sensor)
        .subscribe(_ => this.router.navigate(['/sensors']),
          _ => this.snackBar.openFromTemplate(this.snackbarTemplate, { duration: environment.snackDuration })
        );
    }
    else {
      this.action = 'create';
      this.sensorService.createSensor(sensor)
        .subscribe(_ => this.router.navigate(['/sensors']),
          _ => this.snackBar.openFromTemplate(this.snackbarTemplate, { duration: environment.snackDuration })
        );
    }
  }

  onCancel() {
    this.router.navigate(['/sensors']);
  }

  prepareSensor(): Sensor {
    const formModel = this.sensorForm.value;

    return {
      id: this.sensor.id,
      channel: formModel.channel,
      areaId: formModel.areaId,
      zoneId: formModel.zoneId,
      typeId: formModel.typeId,
      alert: false,
      description: formModel.description,
      enabled: formModel.enabled,
      uiOrder: null,
      uiHidden: formModel.hidden
    };
  }

  prepareZone(): Zone {
    const sensorModel = this.sensorForm.value;
    const zoneModel = this.zoneForm.value;

    return {
      id: sensorModel.zoneId,
      name: zoneModel.zoneName,
      disarmedDelay: zoneModel.disarmedAlert ? parseInt(zoneModel.disarmedDelay, 10) : null,
      awayAlertDelay: zoneModel.awayArmedAlert ? parseInt(zoneModel.awayAlertDelay, 10) : null,
      awayArmDelay: zoneModel.awayArmedAlert ? parseInt(zoneModel.awayArmDelay, 10) : null,
      stayAlertDelay: zoneModel.stayArmedAlert ? parseInt(zoneModel.stayAlertDelay, 10) : null,
      stayArmDelay: zoneModel.stayArmedAlert ? parseInt(zoneModel.stayArmDelay, 10) : null,
      description: zoneModel.zoneName
    };
  }

  prepareArea(): Area {
    const sensorModel = this.sensorForm.value;
    const areaModel = this.areaForm.value;

    return {
      id: sensorModel.areaId,
      name: areaModel.areaName,
      armState: ARM_TYPE.DISARMED
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
    const {controls} = this.areaForm;

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
    const {controls} = this.zoneForm;
    if (event.checked) {
      controls[delayName].setValidators([Validators.required, positiveInteger()]);
    } else {
      controls[delayName].clearValidators();
      controls[delayName].setErrors(null);
    }

    controls[delayName].updateValueAndValidity();
  }

  openDeleteDialog(sensorId: number) {
    const dialogRef = this.dialog.open(SensorDeleteDialogComponent, {
      width: '250px',
      data: {
        description: this.sensor.description,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (this.monitoringState === MONITORING_STATE.READY) {
          this.action = 'delete';
          this.sensorService.deleteSensor(sensorId)
            .subscribe(_ => {
              this.router.navigate(['/sensors']);
            },
              error => this.snackBar.openFromTemplate(this.snackbarTemplate, { duration: environment.snackDuration })
            );
        } else {
          this.action = 'cant delete';
          this.snackBar.openFromTemplate(this.snackbarTemplate, { duration: environment.snackDuration });
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
