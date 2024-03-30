import { Component, Input, OnInit, OnDestroy, TemplateRef, ViewChild, Inject } from '@angular/core';

import { CdkDragDrop, CdkDragStart, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ConfigurationBaseComponent } from '../configuration-base/configuration-base.component';
import { SensorDeleteDialogComponent } from './sensor-delete.component';
import { Area, MONITORING_STATE, Sensor, SensorType, Zone } from '../models';
import { AreaService, AuthenticationService, EventService, LoaderService, MonitoringService, SensorService, ZoneService } from '../services';

import { environment } from '../../environments/environment';
import { AUTHENTICATION_SERVICE } from '../tokens';

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
  areas: Area[] = [];
  isDragging = false;

  constructor(
    @Inject('AreaService') public areaService:AreaService,
    @Inject(AUTHENTICATION_SERVICE) public authService: AuthenticationService,
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
    if (this.isDragging)
      return;

    forkJoin({
      sensors: this.sensorService.getSensors(this.onlyAlerting),
      sensorTypes: this.sensorService.getSensorTypes(),
      zones: this.zoneService.getZones(),
      areas: this.areaService.getAreas()
    })
    .pipe(finalize(() => this.loader.display(false)))
    .subscribe(results => {
        this.sensors = results.sensors.sort((a, b) => a.uiOrder - b.uiOrder);
        this.sensorTypes = results.sensorTypes;
        this.zones = results.zones;
        this.areas = results.areas;
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

  getAreaName(areaId: number) {
    if (this.areas.length && areaId != null) {
        return this.areas.find(x => x.id === areaId).name;
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
        name: this.sensors.find(x => x.id === sensorId).description,
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

  onResetReferences(sensorId: number=null) {
    if (sensorId) {
      this.sensorService.resetReference(sensorId);
    }
    else {
      this.sensorService.resetReferences();
    }
  }

  onDragStarted(event: CdkDragStart<string[]>) {
    this.isDragging = true;
  }

  onDrop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.sensors, event.previousIndex, event.currentIndex);
    this.sensors.forEach((sensor, index) => {
      sensor.uiOrder = index;
    });

    this.sensorService.reorder(this.sensors);
    this.isDragging = false;
    // delayed update
    setTimeout(() => this.updateComponent(), 500);
  }
}

