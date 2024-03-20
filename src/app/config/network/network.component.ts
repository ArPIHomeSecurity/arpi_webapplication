import { Component, Input, OnInit, OnDestroy, Inject, TemplateRef, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ConfigurationBaseComponent } from 'src/app/configuration-base/configuration-base.component';
import { Option, DEFAULT_NOTIFICATION_DYNDNS, DEFAULT_NOTIFICATION_ACCESS, DEFAULT_PASSWORD_VALUE } from '../../models';
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
  networkForm: UntypedFormGroup;
  dyndns: Option = null;
  access: Option = null;

  // values from the noipy python module
  providers = [
      {value: '', label: '--'},
      {value: 'noip', label: 'www.noip.com'},
      {value: 'dyn', label: 'www.dyndns.org'},
      {value: 'duck', label: 'www.duckdns.org'},
  ];

  constructor(
    @Inject('ConfigurationService') private configService: ConfigurationService,
    @Inject('EventService') public eventService: EventService,
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,

    private fb: UntypedFormBuilder,
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

  updateForm(dyndns: Option, access: Option) {

    this.networkForm = this.fb.group({
      dyndnsUsername: getValue(dyndns.value, 'username'),
      dyndnsPassword: getValue(dyndns.value, 'password'),
      dyndnsHostname: getValue(dyndns.value, 'hostname'),
      dyndnsProvider: getValue(dyndns.value, 'provider'),
      dyndnsRestrictHost: getValue(dyndns.value, 'restrict_host'),

      accessSsh: getValue(access.value, 'ssh'),
      accessSshFromLocalNetwork: getValue(access.value, 'ssh_from_local_network')
    });
  }

  updateComponent() {
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
        this.loader.disable(false);
      }
    );
  }

  prepareDyndns(): any {
    const formModel = this.networkForm.value;
    const dyndns: any = {
      username: formModel.dyndnsUsername,
      hostname: formModel.dyndnsHostname,
      provider: formModel.dyndnsProvider,
      restrict_host: formModel.dyndnsRestrictHost
    };

    if (formModel.dyndnsPassword != DEFAULT_PASSWORD_VALUE) {
      dyndns.password = formModel.dyndnsPassword;
    }

    return dyndns;
  }

  prepareAccess(): any {
    const formModel = this.networkForm.value;
    return {
      ssh: formModel.accessSsh,
      ssh_from_local_network: formModel.accessSshFromLocalNetwork
    };
  }

  onPasswordFocus() {
    const passwordControl = this.networkForm.get('dyndnsPassword');

    if (passwordControl.value == DEFAULT_PASSWORD_VALUE) {
      passwordControl.markAsTouched();
      passwordControl.setValue("");
    }
  }
  
  onPasswordBlur() {
    const passwordControl = this.networkForm.get('dyndnsPassword');
  
    // Check if the user has changed the password field's value.
    if (!passwordControl.dirty) {
      // If the user didn't change it, restore the initial value.
      passwordControl.setValue(DEFAULT_PASSWORD_VALUE);
    }
  }

  onSubmit() {
    this.loader.disable(true);
    forkJoin({
      dyndns: this.configService.setOption('network', 'dyndns', this.prepareDyndns()),
      access: this.configService.setOption('network', 'access', this.prepareAccess())
    })
    .subscribe(
      _ => this.updateComponent(),
      _ => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration})
    );
  }
}

