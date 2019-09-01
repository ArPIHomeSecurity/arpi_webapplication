import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { forkJoin } from 'rxjs';

import { FormBuilder, FormGroup } from '@angular/forms';

import { ConfigurationBaseComponent } from '../../configuration-base/configuration-base.component';
import { ConfigurationService, EventService, LoaderService, MonitoringService } from '../../services';
import { Option } from '../../models';
import { getValue } from '../../utils';

const scheduleMicrotask = Promise.resolve(null);

// use string as constant instead of complex type to avoid changing it through a reference
const DEFAULT_EMAIL = {
  option: 'notifications',
  section: 'email',
  value: '{"smtp_username":"", "smtp_password":"", "email_address": ""}'
};
const DEFAULT_GSM = {
  option: 'notifications',
  section: 'gsm',
  value: '{"pin_code":"", "phone_number":""}'
};
const DEFAULT_SUBSCRIPTIONS = {
  option: 'notifications',
  section: 'subscriptions',
  value: '{"email": {"alert_started": false, "alert_stopped": false}, "sms": {"alert_started": false, "alert_stopped": false}}'
};

@Component({
  moduleId: module.id,
  templateUrl: 'notifications.component.html',
  styleUrls: ['notifications.component.scss'],
  providers: [ConfigurationService]
})


export class NotificationsComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  @Input() onlyAlerting = false;
  notificationsForm: FormGroup;
  email: Option = null;
  gsm: Option = null;
  subscriptions: Option = null;

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
    this.updateForm(DEFAULT_EMAIL, DEFAULT_GSM, DEFAULT_SUBSCRIPTIONS);
  }

  ngOnDestroy() {
    super.destroy();
  }

  updateForm(email: Option, gsm: Option, subscriptions: Option) {
//    console.log('Email', this.email);
//    console.log('GSM', this.gsm);
//    console.log('Subscriptions', this.subscriptions);

    this.notificationsForm = this.fb.group({
      smtp_username: getValue(email.value, 'smtp_username'),
      smtp_password: getValue(email.value, 'smtp_password'),
      email_address: getValue(email.value, 'email_address'),

      pin_code: getValue(gsm.value, 'pin_code'),
      phone_number: getValue(gsm.value, 'phone_number'),

      alert_started_email: getValue(getValue(subscriptions.value, 'email'), 'alert_started'),
      alert_stopped_email: getValue(getValue(subscriptions.value, 'email'), 'alert_stopped'),
      alert_started_sms: getValue(getValue(subscriptions.value, 'sms'), 'alert_started'),
      alert_stopped_sms: getValue(getValue(subscriptions.value, 'sms'), 'alert_stopped')
    });
  }

  updateComponent() {
    // avoid ExpressionChangedAfterItHasBeenCheckedError
    // https://github.com/angular/angular/issues/17572#issuecomment-323465737
    scheduleMicrotask.then(() => {
      this.loader.display(true);
    });

    forkJoin(
      this.configService.getOption('notifications', 'email'),
      this.configService.getOption('notifications', 'gsm'),
      this.configService.getOption('notifications', 'subscriptions'))
    .subscribe(results => {
      this.email = results[0] ? results[0] : DEFAULT_EMAIL;
      this.gsm = results[1] ? results[1] : DEFAULT_GSM;
      this.subscriptions = results[2] ? results[2] : DEFAULT_SUBSCRIPTIONS;
      this.email.value = JSON.parse(this.email.value);
      this.gsm.value = JSON.parse(this.gsm.value);
      this.subscriptions.value = JSON.parse(this.subscriptions.value);
      this.updateForm(this.email, this.gsm, this.subscriptions);
      this.loader.display(false);
    });
  }

  prepareEmail(): any {
    const formModel = this.notificationsForm.value;
    const email = {
      'smtp_username': formModel.smtp_username,
      'email_address': formModel.email_address,
    };

    if (formModel.smtp_password) {
      email['smtp_password'] = formModel.smtp_password;
    }

    return email;
  }

  prepareGsm(): any {
    const formModel = this.notificationsForm.value;
    return {
      'pin_code': formModel.pin_code,
      'phone_number': formModel.phone_number
    };
  }

  prepareSubscriptions(): any {
    const formModel = this.notificationsForm.value;
    return {
      'email': {
        'alert_started': formModel.alert_started_email,
        'alert_stopped': formModel.alert_stopped_email,
      },
      'sms': {
        'alert_started': formModel.alert_started_sms,
        'alert_stopped': formModel.alert_stopped_sms
      }
    };
  }

  onSubmit() {
    const email = this.prepareEmail();
    const gsm = this.prepareGsm();
    const subcriptions = this.prepareSubscriptions();
    forkJoin(
      this.configService.setOption('notifications', 'email', email),
      this.configService.setOption('notifications', 'gsm', gsm),
      this.configService.setOption('notifications', 'subscriptions', subcriptions)
    )
    .subscribe(_ => this.updateComponent());
  }
}

