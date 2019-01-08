import { Component, Input, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Observable ,  forkJoin } from 'rxjs';

import { MatDialog, MatSnackBar } from '@angular/material';

import { FormBuilder, FormControl, FormGroup, Validators, ValidatorFn, ValidationErrors } from '@angular/forms';
import { AbstractControl } from '@angular/forms';

import { ArmType, Sensor, Zone } from '../models/index';
import { MonitoringState, String2MonitoringState } from '../models/index';
import { positiveInteger } from '../utils';
import { ZoneDeleteDialog } from './zone-delete.component';
import { EventService, LoaderService, SensorService, ZoneService } from '../services/index';
import { MonitoringService } from '../services/index';

import { environment } from '../../environments/environment';

const scheduleMicrotask = Promise.resolve(null);


@Component({
  moduleId: module.id,
  templateUrl: './zone-detail.component.html',
  styleUrls: ['zone-detail.component.scss'],
  providers: [MonitoringService, SensorService, ZoneService]
})
export class ZoneDetailComponent implements OnInit {
  zoneId: number;
  zone: Zone = null;
  sensors: Sensor[] = [];
  MonitoringState:any = MonitoringState;
  monitoringState: MonitoringState;
  zoneForm: FormGroup;

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
    private snackBar: MatSnackBar
  ) {

    this.route.paramMap.subscribe(params =>
      this.zoneId = +params.get('id')
    );
  }

  ngOnInit() {
    this.monitoringService.getMonitoringState()
      .subscribe(monitoringState => this.monitoringState = monitoringState);
    this.eventService.listen('system_state_change')
      .subscribe(monitoringState => this.monitoringState = String2MonitoringState(monitoringState));

    if (this.zoneId) {
      // avoid ExpressionChangedAfterItHasBeenCheckedError
      // https://github.com/angular/angular/issues/17572#issuecomment-323465737
      scheduleMicrotask.then(() => {
        this.loader.display(true);
      });

      forkJoin(
        this.zoneService.getZone(this.zoneId),
        this.sensorService.getSensors())
      .subscribe(results => {
          this.zone = results[0];
          this.updateForm(this.zone);
          this.sensors = results[1];
          this.loader.display(false);
      });
    }
    else {
      this.zone = new Zone;
      this.zone.disarmed_delay = null;
      this.zone.away_delay = null;
      this.zone.stay_delay = null;
      this.updateForm(this.zone);
    }
  }

  updateForm(zone: Zone) {
    this.zoneForm = this.fb.group({
      name: new FormControl(zone.name, [Validators.required, Validators.maxLength(32)]),
      disarmed_alert: zone.disarmed_delay !== null,
      disarmed_delay: new FormControl(zone.disarmed_delay, zone.disarmed_delay !== null ? [Validators.required, positiveInteger()] : null),
      away_armed_alert: zone.away_delay !== null,
      away_delay: new FormControl(zone.away_delay, zone.away_delay !== null ? [Validators.required, positiveInteger()] : null),
      stay_armed_alert: zone.stay_delay !== null,
      stay_delay: new FormControl(zone.stay_delay, zone.stay_delay !== null ? [Validators.required, positiveInteger()] : null),
      description: new FormControl(zone.description, [Validators.required, Validators.maxLength(128)])
    });
  }

  onSubmit() {
    let zone = this.prepareSaveZone();
    if (this.zoneId) {
      this.zoneService.updateZone(zone).subscribe(
          _ => this.router.navigate(['/zones']),
          _ => this.snackBar.open('Failed to update!', null, {duration: environment.SNACK_DURATION})
      );
    }
    else {
      this.zoneService.createZone(zone).subscribe(
          _ => this.router.navigate(['/zones']),
          _ => this.snackBar.open('Failed to create!', null, {duration: environment.SNACK_DURATION})
      );
    }
  }

  onCancel() {
    this.location.back();
  }

  getSensors() : Sensor[] {
    let results: Sensor[] = [];
    if (this.zone) {
      this.sensors.forEach((sensor) => {
        if (sensor.zone_id === this.zone.id) {
          results.push(sensor);
        }
      });
    }

    return results;
  }

  prepareSaveZone(): Zone {
    const formModel = this.zoneForm.value;

    let zone: Zone = new Zone();
    zone.id = this.zoneId;
    zone.name = formModel.name; 
    zone.description = formModel.description;
    zone.disarmed_delay = formModel.disarmed_alert ? parseInt(formModel.disarmed_delay) : null;
    zone.away_delay = formModel.away_armed_alert ? parseInt(formModel.away_delay) : null;
    zone.stay_delay = formModel.stay_armed_alert ? parseInt(formModel.stay_delay) : null;

    return zone;
  }

  openDeleteDialog(zoneId: number) {
    let dialogRef = this.dialog.open(ZoneDeleteDialog, {
      width: '250px',
      data: {
        name: this.zone.name,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (this.monitoringState === MonitoringState.READY) {
          this.zoneService.deleteZone(zoneId)
            .subscribe(result => this.router.navigate(['/zones']),
                _ => this.snackBar.open('Failed to delete!', null, {duration: environment.SNACK_DURATION})
          );
        }
        else {
          this.snackBar.open("Can't delete zone!", null, {duration: environment.SNACK_DURATION});
        }
      }
    });
  }

  alertWhenChanged(event, delay_name) {
    const controls = this.zoneForm.controls;
    if (event.checked) {
      controls[delay_name].setValidators([Validators.required, positiveInteger()]);
    }
    else {
      controls[delay_name].setValidators(null);
    }
    
    controls[delay_name].updateValueAndValidity();
  }
}
