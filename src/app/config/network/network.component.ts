import { Component, Input, OnInit, OnDestroy, Inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { forkJoin } from 'rxjs';

import { ConfigurationBaseComponent } from 'src/app/configuration-base/configuration-base.component';
import { Option, DEFAULT_NOTIFICATION_DYNDNS, DEFAULT_NOTIFICATION_ACCESS } from '../../models';
import { ConfigurationService, EventService, LoaderService, MonitoringService } from 'src/app/services';
import { getValue } from '../../utils';


const scheduleMicrotask = Promise.resolve(null);


@Component({
  templateUrl: 'network.component.html',
  styleUrls: ['network.component.scss'],
})
export class NetworkComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  @Input() onlyAlerting = false;
  networkForm: FormGroup;
  dyndns: Option = null;
  access: Option = null;

  // values from the noipy python module
  PROVIDERS = [
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
  ) {
    super(eventService, loader, monitoringService);
  }

  ngOnInit() {
    super.initialize();

    this.updateComponent();
    this.updateForm(DEFAULT_NOTIFICATION_DYNDNS, DEFAULT_NOTIFICATION_ACCESS);
  }

  ngOnDestroy() {
    super.destroy();
  }

  updateForm(dyndns: Option, access: Option) {

    this.networkForm = this.fb.group({
      dyndns_username: getValue(dyndns.value, 'username'),
      dyndns_password: getValue(dyndns.value, 'password'),
      dyndns_hostname: getValue(dyndns.value, 'hostname'),
      dyndns_provider: getValue(dyndns.value, 'provider'),

      access_ssh: getValue(access.value, 'ssh'),
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
      username: formModel.dyndns_username,
      hostname: formModel.dyndns_hostname,
      provider: formModel.dyndns_provider
    };

    if (formModel.dyndns_password) {
      dyndns.password = formModel.dyndns_password;
    }

    return dyndns;
  }

  prepareAccess(): any {
    const formModel = this.networkForm.value;
    return {
      ssh: formModel.access_ssh
    };
  }

  onSubmit() {
    forkJoin({
      dyndns: this.configService.setOption('network', 'dyndns', this.prepareDyndns()),
      access: this.configService.setOption('network', 'access', this.prepareAccess())
    })
    .subscribe(_ => this.updateComponent()
    );
  }
}

