import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, Inject, output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CdkDragDrop, CdkDragStart, moveItemInArray } from '@angular/cdk/drag-drop';

import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ConfigurationBaseComponent } from '@app/configuration-base/configuration-base.component';
import { QuestionDialogComponent } from '@app/components/question-dialog/question-dialog.component';
import { MONITORING_STATE, Sensor, Area, Output } from '@app/models';
import { AuthenticationService, EventService, LoaderService, SensorService, AreaService, OutputService } from '@app/services';

import { environment } from '@environments/environment';
import { AUTHENTICATION_SERVICE } from '@app/tokens';

const scheduleMicrotask = Promise.resolve(null);


@Component({
  templateUrl: 'area-list.component.html',
  styleUrls: ['area-list.component.scss'],
  providers: []
})

export class AreaListComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  @ViewChild('snackbarTemplate') snackbarTemplate: TemplateRef<any>;
  action: string;

  CONFIG = 0;
  SENSORS = 1;

  areas: Area[] = null;
  outputs: Output[] = [];
  sensors: Sensor[] = [];
  outputListOpened: boolean[] = [];
  sensorListOpened: boolean[] = [];
  isDragging = false;

  constructor(
    @Inject('AreaService') private areaService: AreaService,
    @Inject(AUTHENTICATION_SERVICE) public authService: AuthenticationService,
    @Inject('EventService') public eventService: EventService,
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('MonitoringService') public monitoringService,
    @Inject('OutputService') private outputService: OutputService,
    @Inject('SensorService') private sensorService: SensorService,

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
    if (this.isDragging)
      return;

    forkJoin({
      areas: this.areaService.getAreas(),
      outputs: this.outputService.getOutputs(),
      sensors: this.sensorService.getSensors()
    })
      .pipe(finalize(() => this.loader.display(false)))
      .subscribe(results => {
        this.areas = results.areas.sort((a, b) => a.uiOrder - b.uiOrder);
        this.outputs = results.outputs;
        this.sensors = results.sensors;
        this.loader.display(false);
        this.loader.disable(false);
      }
      );
  }

  getSensors(areaId: number): Sensor[] {
    const results: Sensor[] = [];
    this.sensors.forEach((sensor) => {
      if (sensor.areaId === areaId) {
        results.push(sensor);
      }
    });

    return results;
  }

  getOutputs(areaId: number): Output[] {
    const results: Output[] = [];
    this.outputs.forEach((output) => {
      if (output.areaId === areaId) {
        results.push(output);
      }
    });

    return results;
  }

  userCanEdit() {
    return this.authService.getRole() === 'admin';
  }

  openDeleteDialog(areaId: number) {
    const area = this.areas.find(x => x.id === areaId);
    const dialogRef = this.dialog.open(QuestionDialogComponent, {
      width: '250px',
      data: {
        title: $localize`:@@delete area:Delete Area`,
        message: $localize`:@@delete area message:Are you sure you want to delete the area "${area.name}"?`,
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
      if (result) {
        if (this.monitoringState === MONITORING_STATE.READY) {
          this.loader.disable(true);
          this.areaService.deleteArea(areaId)
            .pipe(finalize(() => this.loader.disable(false)))
            .subscribe({
              next: _ => {
                this.snackBar.open($localize`:@@area deleted:Area deleted!`, null, { duration: environment.snackDuration });
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

  onDragStarted(event: CdkDragStart<string[]>) {
    this.isDragging = true;
  }

  onDrop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.areas, event.previousIndex, event.currentIndex);
    this.areas.forEach((area, index) => {
      area.uiOrder = index;
    });

    this.areaService.reorder(this.areas);
    this.isDragging = false;
    // delayed update
    setTimeout(() => this.updateComponent(), 500);
  }
}
