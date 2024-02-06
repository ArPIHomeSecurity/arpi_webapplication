import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, Inject } from '@angular/core';
import { Location } from '@angular/common';
import { UntypedFormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ConfigurationBaseComponent } from '../configuration-base/configuration-base.component';
import { OutputDeleteDialogComponent } from './output-delete.component';

import { MONITORING_STATE, Output, OutputDefinitions, Area, OutputTriggerType, SYREN_CHANNEL } from '../models';
import { AreaService, EventService, LoaderService, MonitoringService, OutputService } from '../services';
import { positiveInteger } from '../utils';

import { environment } from '../../environments/environment';

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
  @ViewChild('snackbarTemplate') snackbarTemplate: TemplateRef<any>;
  action: string;

  outputId: number;
  output: Output = null;
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

    if (this.outputId != null) {
      // avoid ExpressionChangedAfterItHasBeenCheckedError
      // https://github.com/angular/angular/issues/17572#issuecomment-323465737
      scheduleMicrotask.then(() => {
        this.loader.display(true);
      });

      forkJoin({
        output: this.outputService.getOutput(this.outputId),
        outputs: this.outputService.getOutputs(),
        areas: this.areaService.getAreas()
      })
        .pipe(finalize(() => this.loader.display(false)))
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
      duration: [output.duration, [Validators.required, (control) => control.value >= -1 ? null : { invalid: $localize`:@@output invalid duration:Must be equal or greater than -1` }]],
      defaultState: [output.defaultState],
      enabled: [output.enabled]
    });
  }

  onSubmit() {
    const output = this.prepareOutput();
    if (this.outputId != null) {
      this.action = 'update';
      this.outputService.updateOutput(output)
        .subscribe(
          _ => this.router.navigate(['/outputs']),
          _ => this.snackBar.openFromTemplate(this.snackbarTemplate, { duration: environment.snackDuration })
        );
    } else {
      this.action = 'create';
      this.outputService.createOutput(output)
        .subscribe(
          _ => this.router.navigate(['/outputs']),
          _ => this.snackBar.openFromTemplate(this.snackbarTemplate, { duration: environment.snackDuration })
        );
    }
  }

  onSelectTriggerType(value: OutputTriggerType) {
    this.output.triggerType = value;

    const controls = this.outputForm.controls;
    if (value === OutputTriggerType.BUTTON) {
      controls.areaId.setValidators(null);
    }
    else if (value === OutputTriggerType.SYSTEM) {
      controls.areaId.setValidators(null);
    }
    else if (value === OutputTriggerType.AREA) {
      controls.areaId.setValidators([Validators.required]);
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
    output.duration = formModel.duration;
    output.defaultState = formModel.defaultState;
    output.enabled = formModel.enabled;

    return output;
  }

  openDeleteDialog(outputId: number) {
    const dialogRef = this.dialog.open(OutputDeleteDialogComponent, {
      width: '250px',
      data: {
        name: this.output.name,
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (this.monitoringState === MONITORING_STATE.READY) {
          this.action = 'delete';
          this.outputService.deleteOutput(outputId)
            .subscribe(_ => this.router.navigate(['/outputs']),
              _ => this.snackBar.openFromTemplate(this.snackbarTemplate, { duration: environment.snackDuration })
            );
        } else {
          this.action = 'cant delete';
          this.snackBar.openFromTemplate(this.snackbarTemplate, { duration: environment.snackDuration });
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
