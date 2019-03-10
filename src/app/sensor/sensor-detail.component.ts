import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';

import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';

import { ConfigurationBaseComponent } from '../configuration-base/configuration-base.component';
import { SensorDeleteDialog } from './sensor-delete.component';
import { MonitoringState, Sensor, SensorType, Zone } from '../models';
import { positiveInteger } from '../utils';
import { EventService, LoaderService, MonitoringService, SensorService, ZoneService } from '../services';

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
  type_id: number;
  zone_id: number;
  enabled: boolean;
  description: string;

  zone_name: string;
  disarmed_delay: number;
  away_delay: number;
  stay_delay: number;
}


@Component({
  moduleId: module.id,
  templateUrl: './sensor-detail.component.html',
  styleUrls: ['sensor-detail.component.scss'],
  providers: []
})
export class SensorDetailComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  sensorId: number;
  sensor: Sensor = null;
  sensors: Sensor[];
  channels: Channel[];
  zones: Zone[];
  sensorTypes: SensorType[];
  sensorForm: FormGroup;
  zoneForm: FormGroup;
  new_zone = false;
  MonitoringState = MonitoringState;
  monitoringState: MonitoringState;

  constructor(
    public loader: LoaderService,
    public eventService: EventService,
    public monitoringService: MonitoringService,

    private fb: FormBuilder,
    private route: ActivatedRoute,
    private eventService: EventService,
    private loader: LoaderService,
    private monitoringService: MonitoringService,
    private sensorService: SensorService,
    private zoneService: ZoneService,
    private router: Router,
    public dialog: MatDialog,
    private location: Location,
    private snackBar: MatSnackBar) {
      super(loader, eventService, monitoringService);

      this.route.paramMap.subscribe(params => {
        if (params.get('id') != null) {
          this.sensorId = +params.get('id');
        }
      });
  }

  ngOnInit() {
    super.initialize();

    // avoid ExpressionChangedAfterItHasBeenCheckedError
    // https://github.com/angular/angular/issues/17572#issuecomment-323465737
    scheduleMicrotask.then(() => {
      this.loader.display(true);
    });

    this.monitoringService.getMonitoringState()
      .subscribe(monitoringState => this.monitoringState = monitoringState);
    this.eventService.listen('system_state_change')
      .subscribe(monitoringState => this.monitoringState = String2MonitoringState(monitoringState));

    if (this.sensorId != null) {
      forkJoin(
        this.sensorService.getSensor(this.sensorId),
        this.sensorService.getSensors(),
        this.zoneService.getZones(),
        this.sensorService.getSensorTypes())
      .subscribe(results => {
          this.sensor = results[0];
          const info = {
            channel: this.sensor.channel,
            type_id: this.sensor.type_id,
            zone_id: this.sensor.zone_id,
            enabled: this.sensor.enabled,
            description: this.sensor.description,

            zone_name: null,
            disarmed_delay: null,
            away_delay: 0,
            stay_delay: 0
          };

          this.sensors = results[1];
          this.zones = results[2];
          this.sensorTypes = results[3].sort((st1, st2) => st1.id > st2.id ? 1 : st1.id < st2.id ? -1 : 0);
          this.channels = this.generateChannels(this.sensors);

          this.updateForm(this.sensor);
          this.loader.display(false);
      });
    } else {
      forkJoin(
        this.sensorService.getSensors(),
        this.sensorService.getSensorTypes(),
        this.zoneService.getZones())
      .subscribe(results => {
        this.sensors = results[0];
        this.sensorTypes = results[1];
        this.zones = results[2];
        this.channels = this.generateChannels(this.sensors);

        this.sensor = new Sensor;
        const firstFreeChannel = this.channels.find(ch => (ch.sensor == null) && (ch.channel >= 0));
				this.sensor.channel = firstFreeChannel ? firstFreeChannel.channel : null;
        this.sensor.zone_id = -1;
        this.sensor.type_id = this.sensorTypes[0].id;

        this.updateForm(this.sensor);
        this.loader.display(false);
      });
    }
  }

  ngOnDestroy() {
    super.destroy();
  }

  updateForm(sensor: Sensor) {
    // create zone form if new zone is selected (zone_id)
    this.zoneForm =  this.fb.group({
      zone_name: new FormControl('', this.sensor.zone_id === -1 ? Validators.required : null),
      disarmed_alert: false,
      disarmed_delay: new FormControl(0),
      away_armed_alert: true,
      away_delay: new FormControl(0, this.sensor.zone_id === -1 ? [Validators.required, positiveInteger()] : null),
      stay_armed_alert: true,
      stay_delay: new FormControl(0, this.sensor.zone_id === -1 ? [Validators.required, positiveInteger()] : null)
    });

    // update the form if it doesn't exists
    this.sensorForm = this.fb.group({
      channel: new FormControl(sensor.channel),
      zone_id: new FormControl(sensor.zone_id, Validators.required),
      type_id: new FormControl(sensor.type_id, Validators.required),
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

    if (this.sensor.zone_id === -1) {
      const zone = this.prepareZone();
      this.zoneService.createZone(zone)
        .subscribe(result => {
            sensor.zone_id = result.id;
            if (this.sensor.id !== undefined) {
              return this.sensorService.updateSensor(sensor)
                .subscribe(_ => this.router.navigate(['/sensors']));
            }

            return this.sensorService.createSensor(sensor)
              .subscribe(_ => this.router.navigate(['/sensors']) );
          },
            _ => this.snackBar.open('Failed to create!', null, {duration: environment.SNACK_DURATION})
        );
    } else {
        if (this.sensorId != null) {
          this.sensorService.updateSensor(sensor)
            .subscribe(
              _ => this.router.navigate(['/sensors']),
              _ => this.snackBar.open('Failed to update!', null, {duration: environment.SNACK_DURATION})
            );
        } else {
          this.sensorService.createSensor(sensor).subscribe(_ => this.router.navigate(['/sensors']),
              _ => this.snackBar.open('Failed to create!', null, {duration: environment.SNACK_DURATION}));
        }
    }
  }

  onCancel() {
    this.location.back();
  }

  prepareSensor(): Sensor {
    const formModel = this.sensorForm.value;

    return {
      id: this.sensor.id,
      channel: formModel.channel,
      zone_id: formModel.zone_id,
      type_id: formModel.type_id,
      alert: false,
      description: formModel.description,
      enabled: formModel.enabled
    };
  }

  prepareZone(): Zone {
    const sensorModel = this.sensorForm.value;
    const zoneModel = this.zoneForm.value;

    return {
      id: sensorModel.zone_id,
      name: zoneModel.zone_name,
      disarmed_delay: !isNaN(parseInt(zoneModel.disarmed_delay, 10)) ? parseInt(zoneModel.disarmed_delay, 10) : null,
      away_delay: !isNaN(parseInt(zoneModel.away_delay, 10)) ? parseInt(zoneModel.away_delay, 10) : null,
      stay_delay: !isNaN(parseInt(zoneModel.stay_delay, 10)) ? parseInt(zoneModel.stay_delay, 10) : null,
      description: zoneModel.zone_name
    };
  }

  onZoneSelected(event) {
    this.sensor.zone_id = event.value;
    const controls = this.zoneForm.controls;

    // if NEW zone selected
    if (this.sensor.zone_id === -1) {
      controls['disarmed_delay'].setValidators([Validators.required, positiveInteger()]);
      controls['away_delay'].setValidators([Validators.required, positiveInteger()]);
      controls['stay_delay'].setValidators([Validators.required, positiveInteger()]);
      controls['zone_name'].setValidators(Validators.required);
    } else {
      controls['zone_name'].clearValidators();
      controls['zone_name'].setErrors(null);
      controls['disarmed_delay'].clearValidators();
      controls['disarmed_delay'].setErrors(null);
      controls['away_delay'].clearValidators();
      controls['away_delay'].setErrors(null);
      controls['stay_delay'].clearValidators();
      controls['stay_delay'].setErrors(null);
    }

    this.zoneForm.updateValueAndValidity();
    this.sensorForm.updateValueAndValidity();
  }

  alertWhenChanged(event, delay_name) {
    const controls = this.zoneForm.controls;
    if (event.checked) {
      controls[delay_name].setValidators([Validators.required, positiveInteger()]);
    } else {
      controls[delay_name].clearValidators();
      controls[delay_name].setErrors(null);
    }

    controls[delay_name].updateValueAndValidity();
  }

  openDeleteDialog(sensorId: number) {
    const dialogRef = this.dialog.open(SensorDeleteDialog, {
      width: '250px',
      data: {
        description: this.sensor.description,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (this.monitoringState === MonitoringState.READY) {
          this.sensorService.deleteSensor(sensorId)
            .subscribe(_ => {
                this.router.navigate(['/sensors']);
              },
              _ => this.snackBar.open('Failed to delete!', null, {duration: environment.SNACK_DURATION})
          );
        } else {
          this.snackBar.open('Can\'t delete sensor!', null, {duration: environment.SNACK_DURATION});
        }
      }
    });
  }

  generateChannels(sensors: Sensor[]): Channel[] {
    // channels are numbered 1..channel count
    const channels: Channel[] = [];
    for (let i = 0; i < environment.channel_count; i++) {
      const sensor = sensors.find(s => s.channel === i);
      channels.push({
        channel: i,
        sensor: sensor
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
