import { Component, OnInit, OnDestroy, Inject, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { finalize } from 'rxjs/operators';

import { ConfigurationBaseComponent } from '@app/configuration-base/configuration-base.component';
import { ConfigurationService, EventService, LoaderService, MonitoringService } from '@app/services';
import { getValue, positiveInteger } from '@app/utils';
import { Option } from '@app/models';
import { environment } from '@environments/environment';
import { forkJoin } from 'rxjs';

const scheduleMicrotask = Promise.resolve(null);


@Component({
    templateUrl: 'syren.component.html',
    styleUrls: ['syren.component.scss'],
    providers: [],
    standalone: false
})

export class SyrenComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {

  syrenForm: FormGroup;
  syren: Option;
  sensitivity: Option;

  testInProgress = false;

  constructor(
    @Inject('EventService') public eventService: EventService,
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,
    @Inject('ConfigurationService') public configurationService: ConfigurationService,

    private fb: FormBuilder,
    private snackBar: MatSnackBar,
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

  updateForm() {
    const silentAlertValue = getValue(this.syren.value, 'silent', null);
    var silentAlert = null;
    if (silentAlertValue === null) {
      silentAlert = 'undefined';
    }
    else if (silentAlertValue === true) {
      silentAlert = 'silent';
    }
    else if (silentAlertValue === false) {
      silentAlert = 'loud';
    }

    this.syrenForm = this.fb.group({
      silentAlert: new FormControl(silentAlert, Validators.required),
      delay: new FormControl(getValue(this.syren.value, 'delay', 0), [Validators.required, Validators.min(0)]),
      duration: new FormControl(getValue(this.syren.value, 'duration', 0), [Validators.required, Validators.min(0)]),

      sensitivity: new FormControl(),
      monitorPeriod: new FormControl(getValue(this.sensitivity.value, 'monitor_period', null)),
      monitorThreshold: new FormControl(getValue(this.sensitivity.value, 'monitor_threshold', null)),
    });

    if (getValue(this.sensitivity.value, 'monitor_period', null) != null && getValue(this.sensitivity.value, 'monitor_threshold', null) != null) {
      this.syrenForm.controls.monitorPeriod.setValidators([Validators.required, positiveInteger()]);
      this.syrenForm.controls.monitorPeriod.enable();
      this.syrenForm.controls.monitorThreshold.setValidators([Validators.required, positiveInteger()]);
      this.syrenForm.controls.monitorThreshold.enable();
      this.syrenForm.controls.sensitivity.setValue(true);
    }
    else {
      this.syrenForm.controls.monitorPeriod.clearValidators();
      this.syrenForm.controls.monitorPeriod.disable();
      this.syrenForm.controls.monitorThreshold.clearValidators();
      this.syrenForm.controls.monitorThreshold.disable();
      this.syrenForm.controls.sensitivity.setValue(false);
    }
  }

  updateComponent() {
    forkJoin({
      syren: this.configurationService.getOption('syren', 'timing'),
      alertSensitivity: this.configurationService.getOption('alert', 'sensitivity')
    })
      .pipe(finalize(() => this.loader.display(false)))
      .subscribe(({ syren, alertSensitivity }) => {
        this.syren = syren;
        this.sensitivity = alertSensitivity;
        this.updateForm();
        this.loader.display(false);
      });
  }

  prepareSyren(): any {
    const formModel = this.syrenForm.value;
    var silentAlert = null;
    if (formModel.silentAlert === 'undefined') {
      silentAlert = null;
    }
    else if (formModel.silentAlert === 'silent') {
      silentAlert = true;
    }
    else if (formModel.silentAlert === 'loud') {
      silentAlert = false;
    }

    return {
      silent: silentAlert,
      delay: formModel.delay,
      duration: formModel.duration
    };
  }

  prepareAlertSensitivity(): any {
    const formModel = this.syrenForm.value;
    return {
      monitor_period: formModel.sensitivity ? formModel.monitorPeriod : null,
      monitor_threshold: formModel.sensitivity ? formModel.monitorThreshold : null
    };
  }

  onSensitivityChanged(event) {
    if (event.checked) {
      this.syrenForm.controls.monitorPeriod.setValidators([Validators.required, positiveInteger()]);
      this.syrenForm.controls.monitorPeriod.enable();
      this.syrenForm.controls.monitorThreshold.setValidators([Validators.required, positiveInteger()]);
      this.syrenForm.controls.monitorThreshold.enable();
    }
    else {
      this.syrenForm.controls.monitorPeriod.clearValidators();
      this.syrenForm.controls.monitorPeriod.setValue(null);
      this.syrenForm.controls.monitorPeriod.disable();
      this.syrenForm.controls.monitorThreshold.clearValidators();
      this.syrenForm.controls.monitorThreshold.setValue(null);
      this.syrenForm.controls.monitorThreshold.disable();
    }
  }

  onTestSyren() {
    const duration = 5;
    this.configurationService.testSyren(duration).subscribe();
    this.testInProgress = true;
    setTimeout(() => this.testInProgress = false, duration * 1000);
  }

  onSubmit() {
    this.loader.disable(true);

    forkJoin({
      syren: this.configurationService.setOption('syren', 'timing', this.prepareSyren()),
      alertSensitivity: this.configurationService.setOption('alert', 'sensitivity', this.prepareAlertSensitivity())
    })
      .pipe(finalize(() => this.loader.disable(false)))
      .subscribe({
        next: _ => this.updateComponent(),
        error: _ => this.snackBar.open($localize`:@@failed update:Failed to update!`, null, { duration: environment.snackDuration })
      });
  }
}
