import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { forkJoin } from 'rxjs';

import { ConfigurationBaseComponent } from '../../configuration-base/configuration-base.component';
import { ConfigurationService, EventService, LoaderService, MonitoringService } from '../../services';
import { Option } from '../../models';


const scheduleMicrotask = Promise.resolve(null);

function getValue(value: any, attribute: string, default_value: any = '') {
  //console.log("Getting attribute:",value,".",attribute," = ",value[attribute]);
  if (value) {
    return value ? value[attribute] : default_value;
  }
  return default_value;
}

// use string as constant instead of complex type to avoid changing it through a reference
const DEFAULT_DYNDNS = JSON.stringify({option:'network', section: 'dyndns', value: '{"username":"", "password":"", "hostname": "", "provider": ""}'});
const DEFAULT_ACCESS = JSON.stringify({option:'network', section: 'access', value: '{"ssh":""}'});


@Component({
  moduleId: module.id,
  templateUrl: 'network.component.html',
  styleUrls: ['network.component.scss'],
  providers: [ConfigurationService]
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
      {value: 'duck', label:'www.duckdns.org'},
  ]

  constructor(
    public loader: LoaderService,
    public eventService: EventService,
    public monitoringService: MonitoringService,

    private fb: FormBuilder,
    private configService: ConfigurationService,
  ) {
    super(loader, eventService, monitoringService);
  }

  ngOnInit() {
    super.initialize();

    this.updateComponent();
    this.updateForm(JSON.parse(DEFAULT_DYNDNS), JSON.parse(DEFAULT_ACCESS));
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

    forkJoin(
      this.configService.getOption('network', 'dyndns'),
      this.configService.getOption('network', 'access'))
    .subscribe(results => {
      this.dyndns = results[0] ? results[0] : JSON.parse(DEFAULT_DYNDNS);
      this.access = results[1] ? results[1] : JSON.parse(DEFAULT_ACCESS);
      this.dyndns.value = this.dyndns.value;
      this.access.value = this.access.value;
      this.updateForm(this.dyndns, this.access);
      this.loader.display(false);
    });
  }

  prepareDyndns(): any {
    const formModel = this.networkForm.value;
    let dyndns = {
      'username': formModel.dyndns_username,
      'hostname': formModel.dyndns_hostname,
      'provider': formModel.dyndns_provider
    };

    if (formModel.dyndns_password) {
      dyndns['password'] = formModel.dyndns_password;
    }

    return dyndns;
  }

  prepareAccess(): any {
    const formModel = this.networkForm.value;
    return {
      'ssh': formModel.access_ssh
    };
  }

  onSubmit() {
    forkJoin(
      this.configService.setOption('network', 'dyndns', this.prepareDyndns()),
      this.configService.setOption('network', 'access', this.prepareAccess()))
    .subscribe(_ => this.updateComponent());
  }
}

