import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Observable ,  forkJoin } from 'rxjs';

import { MatDialog } from '@angular/material';
import { MatSnackBar } from '@angular/material';

import { ArmType, Sensor, SensorType, Zone } from '../models/index';
import { MonitoringState, String2MonitoringState } from '../models/index';
import { SensorDeleteDialog } from './sensor-delete.component';
import { EventService, LoaderService, SensorService, ZoneService } from '../services/index';
import { AuthenticationService, MonitoringService } from '../services/index';

import { environment } from '../../environments/environment';

const scheduleMicrotask = Promise.resolve(null);

@Component({
  moduleId: module.id,
  templateUrl: 'sensor-list.component.html',
  styleUrls: ['sensor-list.component.scss'],
  providers: [MonitoringService, SensorService, ZoneService]
})

export class SensorListComponent implements OnInit, OnDestroy {
  @Input() onlyAlerting = false;
  sensors: Sensor[] = null;
  zones: Zone[] = [];
  sensorTypes: SensorType [] = [];
  MonitoringState:any = MonitoringState;
  monitoringState: MonitoringState;
  isDestroyed = false;

  constructor(
    private authService: AuthenticationService,
    private eventService: EventService,
    private loader: LoaderService,
    private monitoringService: MonitoringService,
    private sensorService: SensorService,
    private zoneService: ZoneService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.isDestroyed = false;
    this.updateComponent();

    this.monitoringService.getMonitoringState()
      .subscribe(monitoringState => this.monitoringState = monitoringState);
    this.eventService.listen('system_state_change')
      .subscribe(monitoringState => this.monitoringState = String2MonitoringState(monitoringState));
  }
  
  ngOnDestroy() {
    this.isDestroyed = true;
  }
  
  updateComponent() {
    // avoid ExpressionChangedAfterItHasBeenCheckedError
    // https://github.com/angular/angular/issues/17572#issuecomment-323465737
    scheduleMicrotask.then(() => {
      this.loader.display(true);
    });

    forkJoin(
      this.sensorService.getSensors(this.onlyAlerting),
      this.sensorService.getSensorTypes(),
      this.zoneService.getZones())
    .subscribe(results => {
      this.sensors = results[0];
      this.sensorTypes = results[1];
      this.zones = results[2];
      if (!this.isDestroyed) {
        this.loader.display(false);
      }
    });
  }

  getZoneName(zoneId: number){
    if (this.zones.length && zoneId) {
        return this.zones.find(x => x.id == zoneId).name;
    }

    return "";
  }

  getSensorTypeName(sensorTypeId: number) {
    if (this.sensorTypes.length) {
      return this.sensorTypes.find(x => x.id == sensorTypeId).name;
    }

    return "";
  }

  userCanEdit() {
    return this.authService.getRole() == 'admin'
  }

  openDeleteDialog(sensorId: number) {
    let dialogRef = this.dialog.open(SensorDeleteDialog, {
      width: '250px',
      data: {
        description: this.sensors.find(x => x.id == sensorId).description,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (this.monitoringState === MonitoringState.READY) {
          this.sensorService.deleteSensor(sensorId).subscribe(result => this.updateComponent(),
              _ => this.snackBar.open('Failed to delete!', null, {duration: environment.SNACK_DURATION})
          );
        }
        else {
          this.snackBar.open("Can't delete sensor!", null, {duration: environment.SNACK_DURATION});
        }
      }
    });
  }

  onResetReferences() {
    this.sensorService.resetReferences();
  }
}

