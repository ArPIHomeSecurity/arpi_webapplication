import { Component, Input, OnInit, OnDestroy, Inject, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ConfigurationBaseComponent } from 'src/app/configuration-base/configuration-base.component';
import { Option, DEFAULT_NOTIFICATION_DYNDNS, DEFAULT_NOTIFICATION_ACCESS } from '../../models';
import { ConfigurationService, EventService, LoaderService, MonitoringService } from 'src/app/services';
import { getValue } from '../../utils';
import { environment } from 'src/environments/environment';


const scheduleMicrotask = Promise.resolve(null);


@Component({
  templateUrl: 'network.component.html',
  styleUrls: ['network.component.scss'],
})
export class NetworkComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  @ViewChild('snackbarTemplate') snackbarTemplate: TemplateRef<any>;
  @Input() onlyAlerting = false;
  networkForm: FormGroup;
  dyndns: Option = null;
  access: Option = null;

  // values from the noipy python module
  providers = [
      {value: 'noip', label: 'www.noip.com'},
      {value: 'dyn', label: 'www.dyndns.org'},
      {value: 'duck', label: 'www.duckdns.org'},
  ];

  constructor(
    @Inject('ConfigurationService') private configService: ConfigurationService,
    @Inject('EventService') public eventService: EventService,
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,

    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    super(eventService, loader, monitoringService);
  }

  ngOnInit() {
    super.initialize();

    this.updateComponent();
  }

  ngOnDestroy() {
    super.destroy();
  }

  updateForm(dyndns: Option, access: Option) {

    this.networkForm = this.fb.group({
      dyndnsUsername: getValue(dyndns.value, 'username'),
      dyndnsPassword: getValue(dyndns.value, 'password'),
      dyndnsHostname: getValue(dyndns.value, 'hostname'),
      dyndnsProvider: getValue(dyndns.value, 'provider'),

      accessSsh: getValue(access.value, 'ssh')
    });
  }

  updateComponent() {
    // avoid ExpressionChangedAfterItHasBeenCheckedError
    // https://github.com/angular/angular/issues/17572#issuecomment-323465737
    scheduleMicrotask.then(() => {
      this.loader.display(true);
    });

    forkJoin({
      dyndns: this.configService.getOption('network', 'dyndns'),
      access: this.configService.getOption('network', 'access')
    })
    .pipe(finalize(() => this.loader.display(false)))
    .subscribe(results => {
        this.dyndns = getValue(results, 'dyndns', DEFAULT_NOTIFICATION_DYNDNS);
        this.access = getValue(results, 'access', DEFAULT_NOTIFICATION_ACCESS);

        this.updateForm(this.dyndns, this.access);
        this.loader.display(false);
      }
    );
  }

  prepareDyndns(): any {
    const formModel = this.networkForm.value;
    const dyndns: any = {
      username: formModel.dyndnsUsername,
      hostname: formModel.dyndnsHostname,
      provider: formModel.dyndnsProvider
    };

    if (formModel.dyndnsPassword) {
      dyndns.password = formModel.dyndnsPassword;
    }

    return dyndns;
  }

  prepareAccess(): any {
    const formModel = this.networkForm.value;
    return {
      ssh: formModel.accessSsh
    };
  }

  onSubmit() {
    forkJoin({
      dyndns: this.configService.setOption('network', 'dyndns', this.prepareDyndns()),
      access: this.configService.setOption('network', 'access', this.prepareAccess())
    })
    .subscribe(
      _ => this.updateComponent(),
      error => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration})
    );
  }
}

