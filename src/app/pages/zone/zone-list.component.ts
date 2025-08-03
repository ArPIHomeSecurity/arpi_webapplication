import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, Inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ConfigurationBaseComponent } from '@app/configuration-base/configuration-base.component';
import { QuestionDialogComponent } from '@app/components/question-dialog/question-dialog.component';
import { MONITORING_STATE, Sensor, Zone } from '@app/models';
import { AuthenticationService, EventService, LoaderService, SensorService, ZoneService } from '@app/services';

import { environment } from '@environments/environment';
import { CdkDragDrop, CdkDragStart, moveItemInArray } from '@angular/cdk/drag-drop';
import { AUTHENTICATION_SERVICE } from '@app/tokens';

const scheduleMicrotask = Promise.resolve(null);

@Component({
  templateUrl: 'zone-list.component.html',
  styleUrls: ['zone-list.component.scss'],
  providers: [],
  standalone: false
})
export class ZoneListComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  CONFIG = 0;
  SENSORS = 1;

  zones: Zone[] = null;
  sensors: Sensor[] = [];
  configOpened: boolean[] = [];
  sensorOpened: boolean[] = [];

  isDragging = false;

  constructor(
    @Inject(AUTHENTICATION_SERVICE) public authService: AuthenticationService,
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
    if (this.isDragging) return;

    forkJoin({
      zones: this.zoneService.getZones(),
      sensors: this.sensorService.getSensors()
    })
      .pipe(finalize(() => this.loader.display(false)))
      .subscribe(results => {
        this.zones = results.zones.sort((a, b) => a.uiOrder - b.uiOrder);
        this.sensors = results.sensors;
        this.loader.display(false);
        this.loader.disable(false);

        this.zones.forEach((zone, i) => {
          this.configOpened[zone.id] = JSON.parse(localStorage.getItem('configOpened_' + zone.id));
          this.sensorOpened[zone.id] = JSON.parse(localStorage.getItem('sensorOpened_' + zone.id));
        });
      });
  }

  getSensors(zoneId: number): Sensor[] {
    const results: Sensor[] = [];
    this.sensors.forEach(sensor => {
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
    const zone = this.zones.find(x => x.id === zoneId);
    const dialogRef = this.dialog.open(QuestionDialogComponent, {
      width: '450px',
      data: {
        title: $localize`:@@delete zone:Delete Zone`,
        message: $localize`:@@delete zone message:Are you sure you want to delete the zone "${zone.name}"?`,
        options: [
          {
            id: 'ok',
            text: $localize`:@@delete:Delete`,
            color: 'warn'
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
          this.zoneService
            .deleteZone(zoneId)
            .pipe(finalize(() => this.loader.disable(false)))
            .subscribe({
              next: _ => {
                this.snackBar.open($localize`:@@zone deleted:Zone deleted!`, '', {
                  duration: environment.snackDuration
                });
                this.updateComponent();
              },
              error: _ =>
                this.snackBar.open($localize`:@@failed delete:Failed to delete!`, '', {
                  duration: environment.snackDuration
                })
            });
        } else {
          this.snackBar.open($localize`:@@cant delete state:Cannot delete while not in READY state!`, '', {
            duration: environment.snackDuration
          });
        }
      }
    });
  }

  onDragStarted(event: CdkDragStart<string[]>) {
    this.isDragging = true;
  }

  onDrop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.zones, event.previousIndex, event.currentIndex);
    this.zones.forEach((zone, index) => {
      zone.uiOrder = index;
    });

    this.zoneService.reorder(this.zones);
    this.isDragging = false;
    // delayed update
    setTimeout(() => this.updateComponent(), 500);
  }

  onOpenConfig(zoneId: number) {
    this.configOpened[zoneId] = true;
    localStorage.setItem('configOpened_' + zoneId, this.configOpened[zoneId].toString());
  }

  onCloseConfig(zoneId: number) {
    this.configOpened[zoneId] = false;
    localStorage.setItem('configOpened_' + zoneId, this.configOpened[zoneId].toString());
  }

  onOpenSensor(zoneId: number) {
    this.sensorOpened[zoneId] = true;
    localStorage.setItem('sensorOpened_' + zoneId, this.sensorOpened[zoneId].toString());
  }

  onCloseSensor(zoneId: number) {
    this.sensorOpened[zoneId] = false;
    localStorage.setItem('sensorOpened_' + zoneId, this.sensorOpened[zoneId].toString());
  }
}
