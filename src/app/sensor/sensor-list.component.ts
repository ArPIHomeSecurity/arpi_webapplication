import { Component, Input, OnInit, OnDestroy, TemplateRef, ViewChild, Inject } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ConfigurationBaseComponent } from '../configuration-base/configuration-base.component';
import { SensorDeleteDialogComponent } from './sensor-delete.component';
import { MONITORING_STATE, Sensor, SensorType, Zone } from '../models';
import { AuthenticationService, EventService, LoaderService, MonitoringService, SensorService, ZoneService } from '../services';

import { environment } from '../../environments/environment';

const scheduleMicrotask = Promise.resolve(null);

@Component({
  templateUrl: 'sensor-list.component.html',
  styleUrls: ['sensor-list.component.scss'],
  providers: []
})

export class SensorListComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  @ViewChild('snackbarTemplate') snackbarTemplate: TemplateRef<any>;
  @Input() onlyAlerting = false;

  action: string;
  sensors: Sensor[] = null;
  sensorTypes: SensorType [] = [];
  zones: Zone[] = [];

  constructor(
    @Inject('AuthenticationService') public authService: AuthenticationService,
    @Inject('EventService') public eventService: EventService,
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,
    @Inject('SensorService') private sensorService: SensorService,
    @Inject('ZoneService') private zoneService: ZoneService,

    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    super(eventService, loader, monitoringService);
  }

  ngOnInit() {
    super.initialize();
    this.editableStates.push(MONITORING_STATE.INVALID_CONFIG);

    // avoid ExpressionChangedAfterItHasBeenCheckedError
    // https://github.com/angular/angular/issues/17572#issuecomment-323465737
    scheduleMicrotask.then(() => {
      this.loader.display(true);
    });
    this.updateComponent();

    // TODO: update only one sensor instead of the whole page
    this.baseSubscriptions.push(
      this.eventService.listen('sensors_state_change')
        .subscribe(_ => this.updateComponent())
    );
  }

  ngOnDestroy() {
    super.destroy();
  }

  updateComponent() {
    forkJoin({
      sensors: this.sensorService.getSensors(this.onlyAlerting),
      sensorTypes: this.sensorService.getSensorTypes(),
      zones: this.zoneService.getZones()
    })
    .pipe(finalize(() => this.loader.display(false)))
    .subscribe(results => {
        this.sensors = results.sensors;
        this.sensorTypes = results.sensorTypes;
        this.zones = results.zones;
        this.loader.display(false);
        this.loader.disable(false);
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
        this.action = 'delete';
        if (this.monitoringState === MONITORING_STATE.READY) {
          this.loader.disable(true);
          this.sensorService.deleteSensor(sensorId)
            .subscribe( _ => this.updateComponent(),
              _ => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration})
          );
        } else {
          this.action = 'cant delete';
          this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration});
        }
      }
    });
  }

  onResetReferences() {
    this.sensorService.resetReferences();
  }
}

