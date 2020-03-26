import { Component, Input, OnInit, OnDestroy } from '@angular/core';

import { forkJoin } from 'rxjs';

import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ConfigurationBaseComponent } from '../configuration-base/configuration-base.component';
import { SensorDeleteDialogComponent } from './sensor-delete.component';
import { MonitoringState, Sensor, SensorType, Zone } from '../models';
import { AuthenticationService, EventService, LoaderService, MonitoringService, SensorService, ZoneService } from '../services';

import { environment } from '../../environments/environment';

const scheduleMicrotask = Promise.resolve(null);

@Component({
  templateUrl: 'sensor-list.component.html',
  styleUrls: ['sensor-list.component.scss'],
  providers: []
})

export class SensorListComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  @Input() onlyAlerting = false;
  sensors: Sensor[] = null;
  zones: Zone[] = [];
  sensorTypes: SensorType [] = [];

  constructor(
    public authService: AuthenticationService,
    public loader: LoaderService,
    public eventService: EventService,
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

    this.updateComponent();

    // TODO: update only one sensor instead of the whole page
    this.baseSubscriptions.push(
      this.eventService.listen('sensors_state_change')
        .subscribe(_ => this.updateComponent(false))
    );
  }

  ngOnDestroy() {
    super.destroy();
  }

  updateComponent(displayLoader = true) {
    // avoid ExpressionChangedAfterItHasBeenCheckedError
    // https://github.com/angular/angular/issues/17572#issuecomment-323465737
    if (displayLoader) {
      // no need to display loader if it's a reload
      scheduleMicrotask.then(() => {
        this.loader.display(true);
      });
    }

    forkJoin({
      sensors: this.sensorService.getSensors(this.onlyAlerting),
      sensorTypes: this.sensorService.getSensorTypes(),
      zones: this.zoneService.getZones()
    })
    .subscribe(results => {
        this.sensors = results.sensors;
        this.sensorTypes = results.sensorTypes;
        this.zones = results.zones;
        this.loader.display(false);
      }
    );
  }

  getZoneName(zoneId: number) {
    if (this.zones.length && zoneId != null) {
        return this.zones.find(x => x.id === zoneId).name;
    }

    return '';
  }

  getSensorTypeName(sensorTypeId: number) {
    if (this.sensorTypes.length) {
      return this.sensorTypes.find(x => x.id === sensorTypeId).name;
    }

    return '';
  }

  userCanEdit() {
    return this.authService.getRole() === 'admin';
  }

  openDeleteDialog(sensorId: number) {
    const dialogRef = this.dialog.open(SensorDeleteDialogComponent, {
      width: '250px',
      data: {
        description: this.sensors.find(x => x.id === sensorId).description,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (this.monitoringState === MonitoringState.READY) {
          this.sensorService.deleteSensor(sensorId).subscribe( _ => this.updateComponent(),
              error => this.snackBar.open('Failed to delete!', null, {duration: environment.SNACK_DURATION})
          );
        } else {
          this.snackBar.open('Can\'t delete sensor!', null, {duration: environment.SNACK_DURATION});
        }
      }
    });
  }

  onResetReferences() {
    this.sensorService.resetReferences();
  }
}

