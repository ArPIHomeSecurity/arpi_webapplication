import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, Inject } from '@angular/core';
import { Location } from '@angular/common';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { forkJoin, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { ConfigurationBaseComponent } from '@app/configuration-base/configuration-base.component';
import { AreaDeleteDialogComponent } from './area-delete.component';

import { MONITORING_STATE, Sensor, Area, Output } from '@app/models';
import { EventService, LoaderService, MonitoringService, SensorService, AreaService, OutputService } from '@app/services';
import { positiveInteger } from '@app/utils';

import { environment } from '@environments/environment';

const scheduleMicrotask = Promise.resolve(null);


@Component({
  templateUrl: './area-detail.component.html',
  styleUrls: ['area-detail.component.scss'],
  providers: []
})
export class AreaDetailComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  @ViewChild('snackbarTemplate') snackbarTemplate: TemplateRef<any>;
  action: string;

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
          catchError((error) => {
            if (error.status === 404) {
              this.area = null 
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
          }
        );
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
      name: new UntypedFormControl(area.name, [Validators.required, Validators.maxLength(32)]),
    });
  }

  onSubmit() {
    const area = this.prepareArea();
    if (this.areaId != null) {
      this.action = 'update';
      this.areaService.updateArea(area)
        .subscribe({
          next: _ => this.router.navigate(['/areas']),
          error: _ => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration})
        });
    } else {
      this.action = 'create';
      this.areaService.createArea(area)
        .subscribe({
          next: _ => this.router.navigate(['/areas']),
          error: _ => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration})
        });
    }
  }

  onCancel() {
    this.router.navigate(['/areas']);
  }

  getSensors(): Sensor[] {
    const results: Sensor[] = [];
    if (this.area) {
      this.sensors.forEach((sensor) => {
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
      this.outputs.forEach((output) => {
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
    const dialogRef = this.dialog.open(AreaDeleteDialogComponent, {
      width: '250px',
      data: {
        name: this.area.name,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (this.monitoringState === MONITORING_STATE.READY) {
          this.action = 'delete';
          this.areaService.deleteArea(areaId)
            .subscribe(_ => this.router.navigate(['/areas']),
                _ => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration})
          );
        } else {
          this.action = 'cant delete';
          this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration});
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
