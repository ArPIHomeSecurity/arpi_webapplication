import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, Inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ConfigurationBaseComponent } from '../configuration-base/configuration-base.component';
import { AreaDeleteDialogComponent } from './area-delete.component';
import { MONITORING_STATE, Sensor, Area } from '../models';
import { AuthenticationService, EventService, LoaderService, SensorService, AreaService } from '../services';

import { environment } from '../../environments/environment';

const scheduleMicrotask = Promise.resolve(null);


@Component({
  templateUrl: 'area-list.component.html',
  styleUrls: ['area-list.component.scss'],
  providers: []
})

export class AreaListComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  @ViewChild('snackbarTemplate') snackbarTemplate: TemplateRef<any>;
  action: string;

  CONFIG = 0;
  SENSORS = 1;

  areas: Area[] = null;
  sensors: Sensor[] = [];
  sensorListClosed: boolean[] = [];
  sensorListOpened: boolean[] = [];

  constructor(
    @Inject('AreaService') private areaService: AreaService,
    @Inject('AuthenticationService') public authService: AuthenticationService,
    @Inject('EventService') public eventService: EventService,
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('MonitoringService') public monitoringService,
    @Inject('SensorService') private sensorService: SensorService,

    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    super(eventService, loader, monitoringService);
  }

  ngOnInit() {
    super.initialize();

    // avoid ExpressionChangedAfterItHasBeenCheckedError
    // https://github.com/angular/angular/issues/17572#issuecomment-323465737
    scheduleMicrotask.then(() => {
      this.loader.display(true);
    });

    this.updateComponent();
  }

  ngOnDestroy() {
    super.destroy();
  }

  updateComponent() {
    forkJoin({
      areas: this.areaService.getAreas(),
      sensors: this.sensorService.getSensors()
    })
    .pipe(finalize(() => this.loader.display(false)))
    .subscribe(results => {
        this.areas = results.areas;
        this.sensors = results.sensors;
        this.loader.display(false);
        this.loader.disable(false);
      }
    );
  }

  getSensors(areaId: number): Sensor[] {
    const results: Sensor[] = [];
    this.sensors.forEach((sensor) => {
      if (sensor.areaId === areaId) {
        results.push(sensor);
      }
    });

    return results;
  }

  userCanEdit() {
    return this.authService.getRole() === 'admin';
  }

  openDeleteDialog(areaId: number) {
    const dialogRef = this.dialog.open(AreaDeleteDialogComponent, {
      width: '250px',
      data: {
        name: this.areas.find(x => x.id === areaId).name,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (this.monitoringState === MONITORING_STATE.READY) {
          this.action = 'delete';
          this.loader.disable(true);
          this.areaService.deleteArea(areaId)
            .subscribe(
              _ => this.updateComponent(),
              _ => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration})
            );
        } else {
          this.action = 'cant delete';
          this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration});
        }
      }
    });
  }
}
