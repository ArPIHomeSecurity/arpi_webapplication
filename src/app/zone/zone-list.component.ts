import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, Inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { forkJoin } from 'rxjs';

import { ConfigurationBaseComponent } from '../configuration-base/configuration-base.component';
import { ZoneDeleteDialogComponent } from './zone-delete.component';
import { MonitoringState, Sensor, Zone } from '../models';
import { AuthenticationService, EventService, LoaderService, SensorService, ZoneService } from '../services';

import { environment } from '../../environments/environment';

const scheduleMicrotask = Promise.resolve(null);


@Component({
  templateUrl: 'zone-list.component.html',
  styleUrls: ['zone-list.component.scss'],
  providers: []
})

export class ZoneListComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  @ViewChild('snacbarTemplate') snackbarTemplate: TemplateRef<any>;
  action: string;

  CONFIG = 0;
  SENSORS = 1;

  sensors: Sensor[] = [];
  zones: Zone[] = null;
  open: boolean[][] = [];

  constructor(
    @Inject('AuthenticationService') public authService: AuthenticationService,
    @Inject('EventService') public eventService: EventService,
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('MonitoringService') public monitoringService,
    @Inject('SensorService') private sensorService: SensorService,
    @Inject('ZoneService') private zoneService: ZoneService,

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
          this.action = 'delete';
          this.zoneService.deleteZone(zoneId)
            .subscribe(
              _ => this.updateComponent(),
              _ => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.SNACK_DURATION})
            );
        } else {
          this.action = 'cant delete';
          this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.SNACK_DURATION});
        }
      }
    });
  }
}
