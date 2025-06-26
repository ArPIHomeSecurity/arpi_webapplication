import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, Inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { forkJoin, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { ConfigurationBaseComponent } from '@app/configuration-base/configuration-base.component';
import { QuestionDialogComponent } from '@app/components/question-dialog/question-dialog.component';
import { MONITORING_STATE, Sensor, Area, Output } from '@app/models';
import {
  EventService,
  LoaderService,
  MonitoringService,
  SensorService,
  AreaService,
  OutputService
} from '@app/services';
import { positiveInteger } from '@app/utils';

import { environment } from '@environments/environment';

const scheduleMicrotask = Promise.resolve(null);

@Component({
  templateUrl: './area-detail.component.html',
  styleUrls: ['area-detail.component.scss'],
  providers: [],
  standalone: false
})
export class AreaDetailComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  areaId: number;
  area: Area = undefined;
  sensors: Sensor[];
  outputs: Output[];
  areaForm: UntypedFormGroup;

  constructor(
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('EventService') public eventService: EventService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,
    @Inject('OutputService') private outputService: OutputService,
    @Inject('SensorService') private sensorService: SensorService,
    @Inject('AreaService') private areaService: AreaService,

    private route: ActivatedRoute,
    public router: Router,
    private fb: UntypedFormBuilder,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    super(eventService, loader, monitoringService);

    this.route.paramMap.subscribe(params => {
      if (params.get('id') != null) {
        this.areaId = +params.get('id');
      }
    });
  }

  ngOnInit() {
    super.initialize();

    if (this.areaId != null) {
      // avoid ExpressionChangedAfterItHasBeenCheckedError
      // https://github.com/angular/angular/issues/17572#issuecomment-323465737
      scheduleMicrotask.then(() => {
        this.loader.display(true);
      });

      forkJoin({
        area: this.areaService.getArea(this.areaId),
        outputs: this.outputService.getOutputs(),
        sensors: this.sensorService.getSensors()
      })
        .pipe(
          catchError(error => {
            if (error.status === 404) {
              this.area = null;
            }
            return throwError(() => error);
          }),
          finalize(() => this.loader.display(false))
        )
        .subscribe(results => {
          this.area = results.area;
          this.updateForm(this.area);
          this.outputs = results.outputs;
          this.sensors = results.sensors;
          this.loader.display(false);
        });
    } else {
      this.area = new Area();
      this.area.name = null;
      this.updateForm(this.area);
    }
  }

  ngOnDestroy() {
    super.destroy();
  }

  updateForm(area: Area) {
    this.areaForm = this.fb.group({
      name: new UntypedFormControl(area.name, [Validators.required, Validators.maxLength(32)])
    });
  }

  onSubmit() {
    const area = this.prepareArea();
    if (this.areaId != null) {
      this.areaService.updateArea(area).subscribe({
        next: _ => this.router.navigate(['/areas']),
        error: _ =>
          this.snackBar.open($localize`:@@failed update:Failed to update!`, null, {
            duration: environment.snackDuration
          })
      });
    } else {
      this.areaService.createArea(area).subscribe({
        next: _ => this.router.navigate(['/areas']),
        error: _ =>
          this.snackBar.open($localize`:@@failed create:Failed to create!`, null, {
            duration: environment.snackDuration
          })
      });
    }
  }

  onCancel() {
    this.router.navigate(['/areas']);
  }

  getSensors(): Sensor[] {
    const results: Sensor[] = [];
    if (this.area) {
      this.sensors.forEach(sensor => {
        if (sensor.areaId === this.area.id) {
          results.push(sensor);
        }
      });
    }

    return results;
  }

  getOutputs(): Output[] {
    const results: Output[] = [];
    if (this.area) {
      this.outputs.forEach(output => {
        if (output.areaId === this.area.id) {
          results.push(output);
        }
      });
    }

    return results;
  }

  prepareArea(): Area {
    const formModel = this.areaForm.value;

    const area: Area = new Area();
    area.id = this.areaId;
    area.name = formModel.name;
    return area;
  }

  openDeleteDialog(areaId: number) {
    const area = this.area;
    const dialogRef = this.dialog.open(QuestionDialogComponent, {
      width: '450px',
      data: {
        title: $localize`:@@delete area:Delete Area`,
        message: $localize`:@@delete area message:Are you sure you want to delete the area "${area.name}"?`,
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
          this.areaService
            .deleteArea(areaId)
            .pipe(finalize(() => this.loader.disable(false)))
            .subscribe({
              next: _ => {
                this.snackBar.open($localize`:@@area deleted:Area deleted!`, null, {
                  duration: environment.snackDuration
                });
                this.router.navigate(['/areas']);
              },
              error: _ =>
                this.snackBar.open($localize`:@@failed delete:Failed to delete!`, null, {
                  duration: environment.snackDuration
                })
            });
        } else {
          this.snackBar.open($localize`:@@cant delete state:Cannot delete while not in READY state!`, null, {
            duration: environment.snackDuration
          });
        }
      }
    });
  }

  alertWhenChanged(event, delayName) {
    const controls = this.areaForm.controls;
    if (event.checked) {
      controls[delayName].setValidators([Validators.required, positiveInteger()]);
    } else {
      controls[delayName].setValidators(null);
    }

    controls[delayName].updateValueAndValidity();
  }
}
