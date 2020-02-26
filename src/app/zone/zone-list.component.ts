import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { forkJoin } from 'rxjs';

import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ConfigurationBaseComponent } from '../configuration-base/configuration-base.component';
import { ZoneDeleteDialogComponent } from './zone-delete.component';
import { MonitoringState, Sensor, Zone } from '../models';
import { AuthenticationService, EventService, LoaderService, MonitoringService, SensorService, ZoneService } from '../services';

import { environment } from '../../environments/environment';

const scheduleMicrotask = Promise.resolve(null);

@Component({
  moduleId: module.id,
  templateUrl: 'zone-list.component.html',
  styleUrls: ['zone-list.component.scss'],
  providers: []
})

export class ZoneListComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  sensors: Sensor[] = [];
  zones: Zone[] = null;
  open: boolean[][] = [];

  constructor(
    public authService: AuthenticationService,
    public eventService: EventService,
    public loader: LoaderService,
    public monitoringService: MonitoringService,
    public router: Router,
    
    private sensorService: SensorService,
    private zoneService: ZoneService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    super(authService, eventService, loader, monitoringService, router);
  }

  ngOnInit() {
    super.initialize();

    this.open['config'] = [];
    this.open['sensors'] = [];

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
    forkJoin(
      this.zoneService.getZones(),
      this.sensorService.getSensors()
    )
    .subscribe(results => {
        this.zones = results[0];
        this.sensors = results[1];
        this.loader.display(false);
      },
      error => {
        if (error.status == 403){
          super.logout();
        }
      }
    );
  }

  getSensors(zoneId: number): Sensor[] {
    const results: Sensor[] = [];
    this.sensors.forEach((sensor) => {
      if (sensor.zone_id === zoneId) {
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
              error => {
                if (error.status == 403) {
                  super.logout();
                }
                else{
                  this.snackBar.open('Failed to delete!', null, {duration: environment.SNACK_DURATION});
                }
              }
          );
        } else {
          this.snackBar.open('Can\'t delete zone!', null, {duration: environment.SNACK_DURATION});
        }
      }
    });
  }
}
