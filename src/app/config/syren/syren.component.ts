import { Component, OnInit, OnDestroy, Inject, TemplateRef, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { finalize } from 'rxjs/operators';

import { ConfigurationBaseComponent } from '../../configuration-base/configuration-base.component';
import { ConfigurationService, EventService, LoaderService, MonitoringService } from '../../services';
import { getValue } from '../../utils';
import { Option } from '../../models';
import { environment } from 'src/environments/environment';

const scheduleMicrotask = Promise.resolve( null );


@Component( {
  templateUrl: 'syren.component.html',
  styleUrls: ['syren.component.scss'],
  providers: []
} )

export class SyrenComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  @ViewChild('snackbarTemplate') snackbarTemplate: TemplateRef<any>;
  syrenForm: UntypedFormGroup;
  syren: Option;

  constructor(
    @Inject('EventService') public eventService: EventService,
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,
    @Inject('ConfigurationService') public configurationService: ConfigurationService,

    private fb: UntypedFormBuilder,
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
    this.syrenForm = this.fb.group({
      silent: new UntypedFormControl(getValue(this.syren.value, 'silent', false),  Validators.required),
      delay: new UntypedFormControl(getValue(this.syren.value, 'delay', 18000), [Validators.required, Validators.min(0)]),
      stopTime: new UntypedFormControl(getValue(this.syren.value, 'stop_time', 18000), [Validators.required, Validators.min(0)]),
    });
  }

  updateComponent() {
    this.configurationService.getOption('syren', 'timing')
      .pipe(finalize(() => this.loader.display(false)))
      .subscribe(syren => {
        this.syren = syren;
        this.updateForm();
        this.loader.display(false);
        this.loader.disable(false);
      }
    );
  }

  prepareSyren(): any {
    const formModel = this.syrenForm.value;
    return {
      silent: formModel.silent,
      delay: formModel.delay,
      stop_time: formModel.stopTime
    };
  }

  onTestSyren() {
    this.configurationService.testSyren(5).subscribe();
  }

  onSubmit() {
    this.loader.disable(true);
    this.configurationService.setOption('syren', 'timing', this.prepareSyren())
      .subscribe(
        _ => this.updateComponent(),
        _ => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration})
    );
  }
}
