import { Component, Input, OnInit, OnDestroy, TemplateRef, ViewChild, Inject } from '@angular/core';

import { CdkDragDrop, CdkDragStart, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ConfigurationBaseComponent } from '@app/configuration-base/configuration-base.component';
import { QuestionDialogComponent } from '@app/components/question-dialog/question-dialog.component';
import { Area, MONITORING_STATE, Sensor, SensorType, Zone } from '@app/models';
import { AreaService, AuthenticationService, EventService, LoaderService, MonitoringService, SensorService, ZoneService } from '@app/services';

import { environment } from '@environments/environment';
import { AUTHENTICATION_SERVICE } from '@app/tokens';

const scheduleMicrotask = Promise.resolve(null);

@Component({
    templateUrl: 'sensor-list.component.html',
    styleUrls: ['sensor-list.component.scss'],
    providers: [],
    standalone: false
})

export class SensorListComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  @Input() onlyAlerting = false;

  sensors: Sensor[] = null;
  sensorTypes: SensorType[] = [];
  zones: Zone[] = [];
  areas: Area[] = [];
  isDragging = false;

  constructor(
    @Inject('AreaService') public areaService: AreaService,
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
    const sensor = this.sensors.find(x => x.id === sensorId);
    const dialogRef = this.dialog.open(QuestionDialogComponent, {
      width: '450px',
      data: {
        title: $localize`:@@delete sensor:Delete Sensor`,
        message: $localize`:@@delete sensor message:Are you sure you want to delete the sensor "${sensor.description}"?`,
        options: [
          {
            id: 'ok',
            text: $localize`:@@delete:Delete`,
            color: 'warn',
          },
          {
            id: 'cancel',
            text: $localize`:@@cancel:Cancel`
          }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'ok') {
        if (this.monitoringState === MONITORING_STATE.READY) {
          this.loader.disable(true);
          this.sensorService.deleteSensor(sensorId)
            .pipe(finalize(() => this.loader.disable(false)))
            .subscribe({
              next: _ => {
                this.snackBar.open($localize`:@@sensor deleted:Sensor deleted!`, null, { duration: environment.snackDuration });
                this.updateComponent();
              },
              error: _ => this.snackBar.open($localize`:@@failed delete:Failed to delete!`, null, { duration: environment.snackDuration })
            });
        } else {
          this.snackBar.open($localize`:@@cant delete state:Cannot delete while not in READY state!`, null, { duration: environment.snackDuration });
        }
      }
    });
  }

  onResetReferences(sensorId: number = null) {
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

