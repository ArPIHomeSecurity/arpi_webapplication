import { Component, OnInit, OnDestroy, Inject, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
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
  syrenForm: FormGroup;
  syren: Option;

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
    this.syrenForm = this.fb.group({
      alertTime: new FormControl(getValue(this.syren.value, 'alert_time', 36000) / 60 ,  Validators.required),
      suspendTime: new FormControl(getValue(this.syren.value, 'suspend_time', 18000) / 60 , Validators.required),
    });
  }

  updateComponent() {
    this.configurationService.getOption('alert', 'syren')
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
      alert_time: formModel.alertTime * 60, // convert to seconds
      suspend_time: formModel.suspendTime * 60, // convert to seconds
    };
  }

  onSubmit() {
    this.loader.disable(true);
    this.configurationService.setOption('alert', 'syren', this.prepareSyren())
      .subscribe(
        _ => this.updateComponent(),
        _ => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration})
    );
  }
}

