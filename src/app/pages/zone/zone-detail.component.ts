import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, Inject } from '@angular/core';
import { Location } from '@angular/common';
import { UntypedFormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { forkJoin, throwError } from 'rxjs';
import { finalize, catchError } from 'rxjs/operators';

import { ConfigurationBaseComponent } from '@app/configuration-base/configuration-base.component';
import { ZoneDeleteDialogComponent } from './zone-delete.component';

import { MONITORING_STATE, Sensor, Zone } from '@app/models';
import { EventService, LoaderService, MonitoringService, SensorService, ZoneService } from '@app/services';
import { positiveInteger } from '@app/utils';

import { environment } from '@environments/environment';

const scheduleMicrotask = Promise.resolve(null);


@Component({
  templateUrl: './zone-detail.component.html',
  styleUrls: ['zone-detail.component.scss'],
  providers: []
})
export class ZoneDetailComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  @ViewChild('snackbarTemplate') snackbarTemplate: TemplateRef<any>;
  action: string;

  zoneId: number;
  zone: Zone = undefined;
  sensors: Sensor[];
  zoneForm: FormGroup;
  areaForm: FormGroup;

  constructor(
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('EventService') public eventService: EventService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,
    @Inject('SensorService') private sensorService: SensorService,
    @Inject('ZoneService') private zoneService: ZoneService,

    private route: ActivatedRoute,
    public router: Router,
    private fb: UntypedFormBuilder,
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
      .pipe(
        catchError((error) => {
          if (error.status === 404) {
            this.zone = null;
          }
          return throwError(() => error);
        }),
        finalize(() => this.loader.display(false))
      )
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
      this.zone.awayAlertDelay = 0;
      this.zone.awayArmDelay = 0;
      this.zone.stayAlertDelay = 0;
      this.zone.stayArmDelay = 0;
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
      awayArmedAlert: zone.awayAlertDelay !== null,
      awayAlertDelay: new FormControl(zone.awayAlertDelay, zone.awayAlertDelay != null ? [Validators.required, positiveInteger()] : null),
      awayArmDelay: new FormControl(zone.awayArmDelay, zone.awayAlertDelay != null ? [Validators.required, positiveInteger()] : null),
      stayArmedAlert: zone.stayAlertDelay !== null,
      stayAlertDelay: new FormControl(zone.stayAlertDelay, zone.stayAlertDelay != null ? [Validators.required, positiveInteger()] : null),
      stayArmDelay: new FormControl(zone.stayArmDelay, zone.stayAlertDelay != null ? [Validators.required, positiveInteger()] : null),
      description: new FormControl(zone.description, [Validators.required, Validators.maxLength(128)])
    });
  }

  onSubmit() {
    const zone = this.prepareZone();
    if (this.zoneId != null) {
      this.action = 'update';
      this.zoneService.updateZone(zone)
        .subscribe({
          next: _ => this.router.navigate(['/zones']),
          error: _ => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration})
        });
    } else {
      this.action = 'create';
      this.zoneService.createZone(zone)
        .subscribe({
          next: _ => this.router.navigate(['/zones']),
          error: _ => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration})
        });
    }
  }

  onCancel() {
    this.router.navigate(['/zones']);
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

  prepareZone(): Zone {
    const formModel = this.zoneForm.value;

    const zone: Zone = new Zone();
    zone.id = this.zoneId;
    zone.name = formModel.name;
    zone.description = formModel.description;
    zone.disarmedDelay = formModel.disarmedAlert ? parseInt(formModel.disarmedDelay, 10) : null;
    zone.awayAlertDelay = formModel.awayArmedAlert ? parseInt(formModel.awayAlertDelay, 10) : null;
    zone.awayArmDelay = formModel.awayArmedAlert ? parseInt(formModel.awayArmDelay, 10) : null;
    zone.stayAlertDelay = formModel.stayArmedAlert ? parseInt(formModel.stayAlertDelay, 10) : null;
    zone.stayArmDelay = formModel.stayArmedAlert ? parseInt(formModel.stayArmDelay, 10) : null;

    return zone;
  }

  prepareSaveArea(): Zone {
    const formModel = this.areaForm.value;

    const zone: Zone = new Zone();
    zone.id = this.zoneId;
    zone.name = formModel.name;
    zone.description = formModel.description;
    zone.disarmedDelay = formModel.disarmedAlert ? parseInt(formModel.disarmedDelay, 10) : null;
    zone.awayAlertDelay = formModel.awayArmedAlert ? parseInt(formModel.awayAlertDelay, 10) : null;
    zone.awayArmDelay = formModel.awayArmedAlert ? parseInt(formModel.awayArmDelay, 10) : null;
    zone.stayAlertDelay = formModel.stayArmedAlert ? parseInt(formModel.stayAlertDelay, 10) : null;
    zone.stayArmDelay = formModel.stayArmedAlert ? parseInt(formModel.stayArmDelay, 10) : null;

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
          this.action = 'delete';
          this.zoneService.deleteZone(zoneId)
            .subscribe({
              next: _ => this.router.navigate(['/zones']),
               error: _ => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration})
            });
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
