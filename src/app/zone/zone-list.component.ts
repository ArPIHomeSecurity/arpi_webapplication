import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { forkJoin } from 'rxjs';

import { ConfigurationBaseComponent } from '../configuration-base/configuration-base.component';
import { ZoneDeleteDialogComponent } from './zone-delete.component';
import { MonitoringState, Sensor, Zone } from '../models';
import { AuthenticationService, EventService, LoaderService, MonitoringService, SensorService, ZoneService } from '../services';

import { environment } from '../../environments/environment';

const scheduleMicrotask = Promise.resolve(null);

@Component({
  templateUrl: 'zone-list.component.html',
  styleUrls: ['zone-list.component.scss'],
  providers: []
})

export class ZoneListComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  CONFIG = 0;
  SENSORS = 1;

  sensors: Sensor[] = [];
  zones: Zone[] = null;
  open: boolean[][] = [];

  constructor(
    public authService: AuthenticationService,
    public eventService: EventService,
    public loader: LoaderService,
    public monitoringService: MonitoringService,

    private sensorService: SensorService,
    private zoneService: ZoneService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    super(eventService, loader, monitoringService);
  }

  ngOnInit() {
    super.initialize();

    this.open[this.CONFIG] = [];
    this.open[this.SENSORS] = [];

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
      zones: this.zoneService.getZones(),
      sensors: this.sensorService.getSensors()
    })
    .subscribe(results => {
        this.zones = results.zones;
        this.sensors = results.sensors;
        this.loader.display(false);
      }
    );
  }

  getSensors(zoneId: number): Sensor[] {
    const results: Sensor[] = [];
    this.sensors.forEach((sensor) => {
      if (sensor.zoneId === zoneId) {
        results.push(sensor);
      }
    });

    return results;
  }

  userCanEdit() {
    return this.authService.getRole() === 'admin';
  }

  openDeleteDialog(zoneId: number) {
    const dialogRef = this.dialog.open(ZoneDeleteDialogComponent, {
      width: '250px',
      data: {
        name: this.zones.find(x => x.id === zoneId).name,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (this.monitoringState === MonitoringState.READY) {
          this.zoneService.deleteZone(zoneId)
            .subscribe(
              _ => this.updateComponent(),
              error => this.snackBar.open('Failed to delete!', null, {duration: environment.SNACK_DURATION})
            );
        } else {
          this.snackBar.open('Can\'t delete zone!', null, {duration: environment.SNACK_DURATION});
        }
      }
    });
  }
}
