import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, Inject } from '@angular/core';
import { UntypedFormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { forkJoin, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { ConfigurationBaseComponent } from '@app/configuration-base/configuration-base.component';
import { QuestionDialogComponent } from '@app/components/question-dialog/question-dialog.component';

import { MONITORING_STATE, Output, OutputDefinitions, Area, OutputTriggerType, SYREN_CHANNEL } from '@app/models';
import { AreaService, EventService, LoaderService, MonitoringService, OutputService } from '@app/services';
import { positiveInteger } from '@app/utils';

import { environment } from '@environments/environment';

const scheduleMicrotask = Promise.resolve(null);


class ChannelOption {
  channel: number;
  label: string;
  output_name: string;
}


@Component({
  templateUrl: './output-detail.component.html',
  styleUrls: ['output-detail.component.scss'],
  providers: []
})
export class OutputDetailComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {

  outputId: number;
  output: Output = undefined;
  outputs: Output[];
  areas: Area[];
  channelOptions: ChannelOption[] = [];
  outputForm: FormGroup;
  outputTriggerTypes: any = OutputTriggerType;
  SYREN_CHANNEL = SYREN_CHANNEL

  constructor(
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('EventService') public eventService: EventService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,
    @Inject('AreaService') public areaService: AreaService,
    @Inject('OutputService') private outputService: OutputService,

    private route: ActivatedRoute,
    public router: Router,
    private fb: UntypedFormBuilder,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    super(eventService, loader, monitoringService);

    this.route.paramMap.subscribe(params => {
      if (params.get('id') != null) {
        this.outputId = +params.get('id');
      }
    });
  }

  ngOnInit() {
    super.initialize();

    // avoid ExpressionChangedAfterItHasBeenCheckedError
    // https://github.com/angular/angular/issues/17572#issuecomment-323465737
    scheduleMicrotask.then(() => {
      this.loader.display(true);
    });

    if (this.outputId != null) {

      forkJoin({
        output: this.outputService.getOutput(this.outputId),
        outputs: this.outputService.getOutputs(),
        areas: this.areaService.getAreas()
      })
        .pipe(
          catchError((error) => {
            if (error.status === 404) {
              this.output = null;
            }
            return throwError(() => error);
          }),
          finalize(() => this.loader.display(false))
        )
        .subscribe(results => {
          this.output = results.output;
          this.output.channel = this.output.channel === null ? -1 : this.output.channel;
          this.output.duration = this.output.duration;
          this.outputs = results.outputs;
          this.areas = results.areas;
          this.channelOptions = this.generateChannels();
          this.updateForm(this.output);
          this.loader.display(false);
        }
        );
    } else {
      forkJoin({
        outputs: this.outputService.getOutputs(),
        areas: this.areaService.getAreas()
      })
        .pipe(finalize(() => this.loader.display(false)))
        .subscribe(results => {
          this.output = new Output();
          this.outputs = results.outputs;
          this.areas = results.areas;
          this.channelOptions = this.generateChannels();
          this.updateForm(this.output);
          this.loader.display(false);
        });
    }
  }

  ngOnDestroy() {
    super.destroy();
  }

  generateChannels(): ChannelOption[] {
    const channels: ChannelOption[] = [{
      channel: -1,
      label: "",
      output_name: ""
    }];

    OutputDefinitions.forEach((outputDefinition, channel) => {
      const option = new ChannelOption();
      option.label = outputDefinition.label;
      option.channel = channel;
      const output = this.outputs.find(o => o.channel === channel);
      if (output) {
        option.output_name = output.name;
      }
      channels.push(option);
    });

    return channels;
  }

  updateForm(output: Output) {
    this.outputForm = this.fb.group({
      name: [output.name, Validators.required],
      description: [output.description],
      channel: [output.channel],
      triggerType: [output.triggerType, Validators.required],
      areaId: [output.areaId],
      delay: [output.delay, [Validators.required, positiveInteger()]],
      duration: new FormControl({ value: output.duration, disabled: output.triggerType !== OutputTriggerType.BUTTON }, [Validators.required, Validators.min(0)]),
      defaultState: [output.defaultState],
      enabled: [output.enabled]
    });
  }

  onSubmit() {
    const output = this.prepareOutput();
    if (this.outputId != null) {
      this.outputService.updateOutput(output)
        .subscribe({
          next: _ => this.router.navigate(['/outputs']),
          error: _ => this.snackBar.open($localize`:@@failed update:Failed to update!`, null, { duration: environment.snackDuration })
        });
    } else {
      output.state = output.defaultState;
      this.outputService.createOutput(output)
        .subscribe({
          next: _ => this.router.navigate(['/outputs']),
          error: _ => this.snackBar.open($localize`:@@failed create:Failed to create!`, null, { duration: environment.snackDuration })
        });
    }
  }

  onSelectTriggerType(value: OutputTriggerType) {
    this.output.triggerType = value;

    const controls = this.outputForm.controls;
    if (value === OutputTriggerType.BUTTON) {
      controls.areaId.setValue(null);
      controls.areaId.setValidators(null);
      controls.duration.enable();
    }
    else if (value === OutputTriggerType.SYSTEM) {
      controls.areaId.setValue(null);
      controls.areaId.setValidators(null);
      controls.duration.setValue(0);
      controls.duration.disable();
    }
    else if (value === OutputTriggerType.AREA) {
      controls.areaId.setValidators([Validators.required]);
      controls.duration.setValue(0);
      controls.duration.disable();
    }

    controls.areaId.updateValueAndValidity();
  }

  onCancel() {
    this.router.navigate(['/outputs']);
  }

  prepareOutput(): Output {
    const formModel = this.outputForm.value;

    const output: Output = new Output();
    output.id = this.outputId;
    output.name = formModel.name;
    output.description = formModel.description;
    output.channel = formModel.channel === -1 ? null : formModel.channel;
    output.triggerType = formModel.triggerType;
    output.areaId = formModel.areaId;
    output.delay = formModel.delay;
    output.duration = formModel.duration || 0;
    output.defaultState = formModel.defaultState;
    output.enabled = formModel.enabled;

    return output;
  }

  openDeleteDialog(outputId: number) {
    const dialogRef = this.dialog.open(QuestionDialogComponent, {
      width: '450px',
      data: {
        title: $localize`:@@delete output:Delete Output`,
        message: $localize`:@@delete output message:Are you sure you want to delete the output "${this.output.name}"?`,
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
          this.loader.disable(true)
          this.outputService.deleteOutput(outputId)
            .pipe(finalize(() => this.loader.disable(false)))
            .subscribe({
              next: _ => {
                this.snackBar.open($localize`:@@output deleted:Output deleted!`, null, { duration: environment.snackDuration });
                this.router.navigate(['/outputs']);
              },
              error: _ => this.snackBar.open($localize`:@@failed delete:Failed to delete!`, null, { duration: environment.snackDuration })
            });
        } else {
          this.snackBar.open($localize`:@@cant delete state:Cannot delete while not in READY state!`, null, { duration: environment.snackDuration });
        }
      }
    });
  }

  alertWhenChanged(event, delayName) {
    const controls = this.outputForm.controls;
    if (event.checked) {
      controls[delayName].setValidators([Validators.required, positiveInteger()]);
    } else {
      controls[delayName].setValidators(null);
    }

    controls[delayName].updateValueAndValidity();
  }
}
