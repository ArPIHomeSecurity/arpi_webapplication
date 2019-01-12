import { Component, Input, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Observable ,  forkJoin } from 'rxjs';

import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { positiveInteger } from '../utils';
import { SensorDeleteDialog } from './sensor-delete.component';
import { ArmType, Sensor, SensorType, Zone } from '../models/index';
import { MonitoringState, String2MonitoringState } from '../models/index';
import { EventService, LoaderService, SensorService, ZoneService } from '../services/index';
import { MonitoringService } from '../services/index';

import { MatDialog, MatSnackBar } from '@angular/material';

import { environment } from '../../environments/environment';

const scheduleMicrotask = Promise.resolve(null);


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
export class SensorDetailComponent implements OnInit {
  sensorId: number;
  sensor: Sensor = null;
  channels = [];
  zones: Zone[] = [];
  sensorTypes: SensorType [] = [];
  sensorForm: FormGroup;
  zoneForm: FormGroup;
  new_zone = false;
  MonitoringState = MonitoringState;
  monitoringState: MonitoringState;

  constructor(
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

    this.route.paramMap.subscribe(params =>
      this.sensorId = +params.get('id')
    );
  }

  ngOnInit() {
    // channels are numbered 1..15
    for (let i = 1; i <= environment.channel_count; i++){
      this.channels.push(i);
    }

    // avoid ExpressionChangedAfterItHasBeenCheckedError
    // https://github.com/angular/angular/issues/17572#issuecomment-323465737
    scheduleMicrotask.then(() => {
      this.loader.display(true);
    });

    this.monitoringService.getMonitoringState()
      .subscribe(monitoringState => this.monitoringState = monitoringState);
    this.eventService.listen('system_state_change')
      .subscribe(monitoringState => this.monitoringState = String2MonitoringState(monitoringState));

    if (this.sensorId) {
      forkJoin(
        this.sensorService.getSensor(this.sensorId),
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
            away_delay: null,
            stay_delay: null
          };
          this.updateForm(info);

          this.zones = results[1];
          this.sensorTypes = results[2];
          this.loader.display(false);
      });
    } else {
      forkJoin(
        this.zoneService.getZones(),
        this.sensorService.getSensorTypes())
      .subscribe(results => {
        this.zones = results[0];
        this.sensorTypes = results[1];

        this.sensor = new Sensor;
        const info = {
          channel: this.sensor.channel,
          type_id: this.sensor.type_id,
          zone_id: this.sensor.zone_id,
          enabled: this.sensor.enabled,
          description: this.sensor.description,

          zone_name: null,
          disarmed_delay: null,
          away_delay: null,
          stay_delay: null
        };
        this.updateForm(info);
        this.loader.display(false);
      });
    }
  }

  updateForm(sensor: SensorInfo) {
    this.zoneForm =  this.fb.group({
      zone_name: sensor.zone_name,
      disarmed_alert: sensor.disarmed_delay !== null,
      disarmed_delay:
        new FormControl(sensor.disarmed_delay, sensor.disarmed_delay !== null ? [Validators.required, positiveInteger()] : null),
      away_armed_alert: sensor.away_delay !== null,
      away_delay: new FormControl(sensor.away_delay, sensor.away_delay !== null ? [Validators.required, positiveInteger()] : null),
      stay_armed_alert: sensor.stay_delay !== null,
      stay_delay: new FormControl(sensor.stay_delay, sensor.stay_delay !== null ? [Validators.required, positiveInteger()] : null)
    });
    this.sensorForm = this.fb.group({
      channel: new FormControl(sensor.channel, Validators.required),
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
    if (this.new_zone) {
      this.zoneService.createZone(zone)
        .subscribe(result => {
            console.log('Zone: ', result);
            sensor.zone_id = result.id;
            if (this.sensor.id !== undefined) {
              return this.sensorService.updateSensor(sensor)
                  .subscribe(_ => this.router.navigate(['/sensors']));
            }

            return this.sensorService.createSensor(sensor)
                .subscribe(_ => {console.log('Sensor: ', result); this.router.navigate(['/sensors']); });
          },
            _ => this.snackBar.open('Failed to create!', null, {duration: environment.SNACK_DURATION})
      );
    } else {
        if (this.sensor.id) {
          this.sensorService.updateSensor(sensor).subscribe(
              _ => this.router.navigate(['/sensors']),
              _ => this.snackBar.open('Failed to update!', null, {duration: environment.SNACK_DURATION}));
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
      disarmed_delay: parseInt(zoneModel.disarmed_delay),
      away_delay: parseInt(zoneModel.away_delay),
      stay_delay: parseInt(zoneModel.away_delay),
      description: ''
    };
  }

  onZoneSelected(event) {
    this.new_zone = (event.value === 'new');

    const controls = this.zoneForm.controls;
    if (this.new_zone) {
      controls['disarmed_delay'].setValidators([Validators.required, positiveInteger()]);
      controls['away_delay'].setValidators([Validators.required, positiveInteger()]);
      controls['stay_delay'].setValidators([Validators.required, positiveInteger()]);
      controls['zone_name'].setValidators(Validators.required);
    } else {
      controls['zone_name'].setValidators(null);
      controls['disarmed_delay'].setValidators(null);
      controls['away_delay'].setValidators(null);
      controls['stay_delay'].setValidators(null);
      this.zoneForm.updateValueAndValidity();
    }
  }

  alertWhenChanged(event, delay_name) {
    const controls = this.zoneForm.controls;
    if (event.checked) {
      controls[delay_name].setValidators([Validators.required, positiveInteger()]);
    } else {
      controls[delay_name].setValidators(null);
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
              this.router.navigate(['/sensors'])},
              _ => this.snackBar.open('Failed to delete!', null, {duration: environment.SNACK_DURATION})
          );
        } else {
          this.snackBar.open('Can\'t delete sensor!', null, {duration: environment.SNACK_DURATION});
        }
      }
    });
  }
}
