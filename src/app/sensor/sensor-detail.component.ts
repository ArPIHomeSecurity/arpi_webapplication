import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, Inject } from '@angular/core';
import { Location } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ConfigurationBaseComponent } from '../configuration-base/configuration-base.component';
import { SensorDeleteDialogComponent } from './sensor-delete.component';
import { MONITORING_STATE, Sensor, SensorType, Zone, string2MonitoringState } from '../models';
import { EventService, LoaderService, MonitoringService, SensorService, ZoneService } from '../services';
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
 * Helper class for storing sensor and zone informations.
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
  zones: Zone[];
  sensorTypes: SensorType[];
  sensorForm: FormGroup;
  zoneForm: FormGroup;
  newZone = false;
  monitoringStates = MONITORING_STATE;

  constructor(
    @Inject('EventService') public eventService: EventService,
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,
    @Inject('SensorService') private sensorService: SensorService,
    @Inject('ZoneService') private zoneService: ZoneService,

    public router: Router,

    private fb: FormBuilder,
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
        sensorTypes: this.sensorService.getSensorTypes()
      })
      .pipe(finalize(() => this.loader.display(false)))
      .subscribe(results => {
          this.sensor = results.sensor;
          this.sensors = results.sensors;
          this.zones = results.zones;
          this.sensorTypes = results.sensorTypes.sort((st1, st2) => st1.id > st2.id ? 1 : st1.id < st2.id ? -1 : 0);
          this.channels = this.generateChannels(this.sensors);

          this.updateForm(this.sensor);
          this.loader.display(false);
        });
    } else {
      forkJoin({
        sensors: this.sensorService.getSensors(),
        sensorTypes: this.sensorService.getSensorTypes(),
        zones: this.zoneService.getZones()
      })
      .pipe(finalize(() => this.loader.display(false)))
      .subscribe(results => {
          this.sensors = results.sensors;
          this.sensorTypes = results.sensorTypes;
          this.zones = results.zones;
          this.channels = this.generateChannels(this.sensors);

          this.sensor = new Sensor();
          this.sensor.enabled = true;
          const firstFreeChannel = this.channels.find(ch => (ch.sensor == null) && (ch.channel >= 0));
          this.sensor.channel = firstFreeChannel ? firstFreeChannel.channel : null;
          this.sensor.zoneId = -1;
          this.sensor.typeId = this.sensorTypes[0].id;

          this.updateForm(this.sensor);
          this.loader.display(false);
        });
    }
  }

  ngOnDestroy() {
    super.destroy();
  }

  updateForm(sensor: Sensor) {
    // create zone form if new zone is selected (zoneId)
    this.zoneForm =  this.fb.group({
      zoneName: new FormControl('', this.sensor.zoneId === -1 ? [Validators.required, Validators.maxLength(32)] : null),
      disarmedAlert: false,
      disarmedDelay: new FormControl(0),
      awayArmedAlert: true,
      awayAlertDelay: new FormControl(0, this.sensor.zoneId === -1 ? [Validators.required, positiveInteger()] : null),
      awayArmDelay: new FormControl(0, this.sensor.zoneId === -1 ? [Validators.required, positiveInteger()] : null),
      stayArmedAlert: true,
      stayAlertDelay: new FormControl(0, this.sensor.zoneId === -1 ? [Validators.required, positiveInteger()] : null),
      stayArmDelay: new FormControl(0, this.sensor.zoneId === -1 ? [Validators.required, positiveInteger()] : null)
    });

    // update the form if it doesn't exists
    this.sensorForm = this.fb.group({
      channel: new FormControl(sensor.channel),
      zoneId: new FormControl(sensor.zoneId, Validators.required),
      typeId: new FormControl(sensor.typeId, Validators.required),
      enabled: sensor.enabled,
      description: new FormControl(sensor.description, Validators.required),
      zoneForm: this.zoneForm
    });
  }

  onSubmit() {
    const sensor = this.prepareSensor();
    const zone = this.prepareZone();

    if (sensor.channel >= 0 && this.channels[sensor.channel].sensor != null && sensor.id !== this.channels[sensor.channel].sensor.id) {
      // disconnect sensor on channel collision
      this.channels[sensor.channel].sensor.channel = -1;
      this.sensorService.updateSensor(this.channels[sensor.channel].sensor);
    }

    if (this.sensor.zoneId === -1) {
      this.action = 'create';
      this.zoneService.createZone(zone)
        .subscribe(result => {
          sensor.zoneId = result.id;
          if (this.sensor.id !== undefined) {
            return this.sensorService.updateSensor(sensor)
              .subscribe(_ => this.router.navigate(['/sensors']));
          }

          return this.sensorService.createSensor(sensor)
            .subscribe(_ => this.router.navigate(['/sensors']) );
        },
        _ => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration})
      );
    } else {
        if (this.sensorId != null) {
          this.action = 'update';
          this.sensorService.updateSensor(sensor)
            .subscribe(_ => this.router.navigate(['/sensors']),
              _ => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration})
            );
        } else {
          this.action = 'create';
          this.sensorService.createSensor(sensor)
            .subscribe(_ => this.router.navigate(['/sensors']),
              _ => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration})
            );
        }
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
      zoneId: formModel.zoneId,
      typeId: formModel.typeId,
      alert: false,
      description: formModel.description,
      enabled: formModel.enabled
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

  onZoneSelected(event) {
    this.sensor.zoneId = event.value;
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

  alertWhenChanged(event, delayName) {
    const controls = this.zoneForm.controls;
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
              error => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration})
          );
        } else {
          this.action = 'cant delete';
          this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration});
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
