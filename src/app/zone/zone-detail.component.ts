import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, Inject } from '@angular/core';
import { Location } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ConfigurationBaseComponent } from '../configuration-base/configuration-base.component';
import { ZoneDeleteDialogComponent } from './zone-delete.component';

import { MONITORING_STATE, Sensor, Zone } from '../models';
import { EventService, LoaderService, MonitoringService, SensorService, ZoneService } from '../services';
import { positiveInteger } from '../utils';

import { environment } from '../../environments/environment';

const scheduleMicrotask = Promise.resolve(null);


@Component({
  templateUrl: './zone-detail.component.html',
  styleUrls: ['zone-detail.component.scss'],
  providers: []
})
export class ZoneDetailComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  @ViewChild('snacbarTemplate') snackbarTemplate: TemplateRef<any>;
  action: string;

  zoneId: number;
  zone: Zone = null;
  sensors: Sensor[];
  zoneForm: FormGroup;

  constructor(
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('EventService') public eventService: EventService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,
    @Inject('SensorService') private sensorService: SensorService,
    @Inject('ZoneService') private zoneService: ZoneService,

    private route: ActivatedRoute,
    public router: Router,
    private fb: FormBuilder,
    private location: Location,
    public dialog: MatDialog,
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
      .pipe(finalize(() => this.loader.display(false)))
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
      disarmedAlert: zone.disarmedDelay !== null,
      disarmedDelay: new FormControl(zone.disarmedDelay, zone.disarmedDelay != null ? [Validators.required, positiveInteger()] : null),
      awayArmedAlert: zone.awayDelay !== null,
      awayDelay: new FormControl(zone.awayDelay, zone.awayDelay != null ? [Validators.required, positiveInteger()] : null),
      stayArmedAlert: zone.stayDelay !== null,
      stayDelay: new FormControl(zone.stayDelay, zone.stayDelay != null ? [Validators.required, positiveInteger()] : null),
      description: new FormControl(zone.description, [Validators.required, Validators.maxLength(128)])
    });
  }

  onSubmit() {
    const zone = this.prepareSaveZone();
    if (this.zoneId != null) {
      this.action = 'update';
      this.zoneService.updateZone(zone)
        .subscribe(
          _ => this.router.navigate(['/zones']),
          _ => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration})
        );
    } else {
      this.action = 'create';
      this.zoneService.createZone(zone)
        .subscribe(
          _ => this.router.navigate(['/zones']),
          _ => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration})
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
    zone.disarmedDelay = formModel.disarmedAlert ? parseInt(formModel.disarmedDelay, 10) : null;
    zone.awayDelay = formModel.awayArmedAlert ? parseInt(formModel.awayDelay, 10) : null;
    zone.stayDelay = formModel.stayArmedAlert ? parseInt(formModel.stayDelay, 10) : null;

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
        if (this.monitoringState === MONITORING_STATE.READY) {
          this.action = 'celete';
          this.zoneService.deleteZone(zoneId)
            .subscribe(_ => this.router.navigate(['/zones']),
                _ => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration})
          );
        } else {
          this.action = 'cant delete';
          this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration});
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
