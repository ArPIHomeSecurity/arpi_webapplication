import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ConfigurationBaseComponent } from '../configuration-base/configuration-base.component';
import { ZoneDeleteDialogComponent } from './zone-delete.component';
import { MonitoringState, Sensor, Zone } from '../models';
import { positiveInteger } from '../utils';
import { EventService, LoaderService, MonitoringService, SensorService, ZoneService } from '../services';

import { environment } from '../../environments/environment';

const scheduleMicrotask = Promise.resolve(null);


@Component({
  templateUrl: './zone-detail.component.html',
  styleUrls: ['zone-detail.component.scss'],
  providers: []
})
export class ZoneDetailComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  zoneId: number;
  zone: Zone = null;
  sensors: Sensor[];
  zoneForm: FormGroup;

  constructor(
    public loader: LoaderService,
    public eventService: EventService,
    public monitoringService: MonitoringService,
    public router: Router,

    private fb: FormBuilder,
    private route: ActivatedRoute,
    private sensorService: SensorService,
    private zoneService: ZoneService,
    public dialog: MatDialog,
    private location: Location,
    private snackBar: MatSnackBar
  ) {
    super(eventService, loader, monitoringService);

    this.route.paramMap.subscribe(params => {
      if (params.get('id') != null) {
        this.zoneId = +params.get('id');
      }
    });
  }

  ngOnInit() {
    super.initialize();

    if (this.zoneId != null) {
      // avoid ExpressionChangedAfterItHasBeenCheckedError
      // https://github.com/angular/angular/issues/17572#issuecomment-323465737
      scheduleMicrotask.then(() => {
        this.loader.display(true);
      });

      forkJoin({
        zone: this.zoneService.getZone(this.zoneId),
        sensors: this.sensorService.getSensors()
      })
      .subscribe(results => {
          this.zone = results.zone;
          this.updateForm(this.zone);
          this.sensors = results.sensors;
          this.loader.display(false);
        }
      );
    } else {
      this.zone = new Zone();
      this.zone.disarmedDelay = null;
      this.zone.awayDelay = 0;
      this.zone.stayDelay = 0;
      this.updateForm(this.zone);
    }
  }

  ngOnDestroy() {
    super.destroy();
  }

  updateForm(zone: Zone) {
    this.zoneForm = this.fb.group({
      name: new FormControl(zone.name, [Validators.required, Validators.maxLength(32)]),
      disarmed_alert: zone.disarmedDelay !== null,
      disarmed_delay: new FormControl(zone.disarmedDelay, zone.disarmedDelay != null ? [Validators.required, positiveInteger()] : null),
      away_armed_alert: zone.awayDelay !== null,
      away_delay: new FormControl(zone.awayDelay, zone.awayDelay != null ? [Validators.required, positiveInteger()] : null),
      stay_armed_alert: zone.stayDelay !== null,
      stay_delay: new FormControl(zone.stayDelay, zone.stayDelay != null ? [Validators.required, positiveInteger()] : null),
      description: new FormControl(zone.description, [Validators.required, Validators.maxLength(128)])
    });
  }

  onSubmit() {
    const zone = this.prepareSaveZone();
    if (this.zoneId != null) {
      this.zoneService.updateZone(zone)
        .subscribe(
          _ => this.router.navigate(['/zones']),
          error => this.snackBar.open('Failed to update!', null, {duration: environment.SNACK_DURATION})
        );
    } else {
      this.zoneService.createZone(zone)
        .subscribe(
          _ => this.router.navigate(['/zones']),
          error => this.snackBar.open('Failed to create!', null, {duration: environment.SNACK_DURATION})
        );
    }
  }

  onCancel() {
    this.location.back();
  }

  getSensors(): Sensor[] {
    const results: Sensor[] = [];
    if (this.zone) {
      this.sensors.forEach((sensor) => {
        if (sensor.zoneId === this.zone.id) {
          results.push(sensor);
        }
      });
    }

    return results;
  }

  prepareSaveZone(): Zone {
    const formModel = this.zoneForm.value;

    const zone: Zone = new Zone();
    zone.id = this.zoneId;
    zone.name = formModel.name;
    zone.description = formModel.description;
    zone.disarmedDelay = formModel.disarmed_alert ? parseInt(formModel.disarmed_delay, 10) : null;
    zone.awayDelay = formModel.away_armed_alert ? parseInt(formModel.away_delay, 10) : null;
    zone.stayDelay = formModel.stay_armed_alert ? parseInt(formModel.stay_delay, 10) : null;

    return zone;
  }

  openDeleteDialog(zoneId: number) {
    const dialogRef = this.dialog.open(ZoneDeleteDialogComponent, {
      width: '250px',
      data: {
        name: this.zone.name,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (this.monitoringState === MonitoringState.READY) {
          this.zoneService.deleteZone(zoneId)
            .subscribe(_ => this.router.navigate(['/zones']),
                _ => this.snackBar.open('Failed to delete!', null, {duration: environment.SNACK_DURATION})
          );
        } else {
          this.snackBar.open('Can\'t delete zone!', null, {duration: environment.SNACK_DURATION});
        }
      }
    });
  }

  alertWhenChanged(event, delayName) {
    const controls = this.zoneForm.controls;
    if (event.checked) {
      controls[delayName].setValidators([Validators.required, positiveInteger()]);
    } else {
      controls[delayName].setValidators(null);
    }

    controls[delayName].updateValueAndValidity();
  }
}
