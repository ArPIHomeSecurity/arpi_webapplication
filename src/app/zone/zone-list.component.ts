import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';

import { MatDialog, MatSnackBar } from '@angular/material';

import { Sensor, Zone } from '../models/index';
import { MonitoringState, String2MonitoringState } from '../models/index';
import { ZoneDeleteDialog } from './zone-delete.component';
import { EventService, LoaderService, SensorService, ZoneService } from '../services/index';
import { AuthenticationService, MonitoringService } from '../services/index';

import { environment } from '../../environments/environment';

const scheduleMicrotask = Promise.resolve(null);

@Component({
  moduleId: module.id,
  templateUrl: 'zone-list.component.html',
  styleUrls: ['zone-list.component.scss'],
  providers: []
})

export class ZoneListComponent implements OnInit, OnDestroy {
  sensors: Sensor[] = [];
  zones: Zone[] = null;
  MonitoringState:any = MonitoringState;
  monitoringState: MonitoringState;
  open: boolean[][] = [];
  subscriptions: Subscription[];

  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private eventService: EventService,
    private loader: LoaderService,
    private sensorService: SensorService,
    private zoneService: ZoneService,
    private monitoringService: MonitoringService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
) {}

  ngOnInit() {
    this.open['config'] = []
    this.open['sensors'] = []

    // avoid ExpressionChangedAfterItHasBeenCheckedError
    // https://github.com/angular/angular/issues/17572#issuecomment-323465737
    scheduleMicrotask.then(() => {
      this.loader.display(true);
    });

    this.monitoringService.getMonitoringState()
    .subscribe(monitoringState => {
      this.monitoringState = monitoringState;
        this.onStateChange();
    });

    this.subscriptions = [];
    this.subscriptions.push(
      this.eventService.listen('system_state_change')
      .subscribe(monitoringState => {
        this.monitoringState = String2MonitoringState(monitoringState);
        this.onStateChange();
    }));

    this.updateComponent();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(_ => _.unsubscribe());
    this.subscriptions = [];
    this.loader.clearMessage();
  }

  onStateChange() {
    if (this.monitoringState !== MonitoringState.READY) {
      this.loader.setMessage('The system is not ready, you can\'t make changes in the configuration!');
    } else {
      this.loader.clearMessage();
    }
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
    });
  }

  getSensors(zoneId: number) : Sensor[] {
    let results: Sensor[] = [];
    this.sensors.forEach((sensor) => {
      if (sensor.zone_id === zoneId) {
        results.push(sensor);
      }
    });

    return results;
  }

  userCanEdit() {
    return this.authService.getRole() == 'admin'
  }

  openDeleteDialog(zoneId: number) {
    let dialogRef = this.dialog.open(ZoneDeleteDialog, {
      width: '250px',
      data: {
        name: this.zones.find(x => x.id == zoneId).name,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (this.monitoringState === MonitoringState.READY) {
          this.zoneService.deleteZone(zoneId)
            .subscribe(result => this.updateComponent(),
                _ => this.snackBar.open('Failed to delete!', null, {duration: environment.SNACK_DURATION})
          );
        }else {
          this.snackBar.open("Can't delete zone!", null, {duration: environment.SNACK_DURATION});
        }
      }
    });
  }
}
