import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { forkJoin } from 'rxjs';

import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { ConfigurationService, LoaderService } from '../../services/index';
import { Option } from '../../models/index';

import { environment } from '../../../environments/environment';

const scheduleMicrotask = Promise.resolve(null);

function getValue(value: any, attribute: string, default_value: any = '') {
  //console.log("Getting attribute:",value,".",attribute," = ",value[attribute]);
  if (value) {
    return value ? value[attribute] : default_value;
  }
  return default_value;
}

//use string as constant instead of complex type to avoid changing it through a reference
const DEFAULT_EMAIL = JSON.stringify({option:'notifications', section: 'email', value: '{"smtp_username":"", "smtp_password":"", "email_address": ""}'});
const DEFAULT_GSM = JSON.stringify({option:'notifications', section: 'gsm', value: '{"pin_code":"", "phone_number":""}'});
const DEFAULT_SUBSCRIPTIONS = JSON.stringify({option:'notifications', section: 'subscriptions', value: '{"email": {"alert_started": false, "alert_stopped": false}, "sms": {"alert_started": false, "alert_stopped": false}}'});

@Component({
  moduleId: module.id,
  templateUrl: 'notifications.component.html',
  styleUrls: ['notifications.component.scss'],
  providers: [ConfigurationService]
})


export class NotificationsComponent implements OnInit {
  @Input() onlyAlerting = false;
  notificationsForm: FormGroup;
  email: Option = null;
  gsm: Option = null;
  subscriptions: Option = null;

  constructor(
    private fb: FormBuilder,
    private loader: LoaderService,
    private configService: ConfigurationService,
  ) { }

  ngOnInit() {
    this.updateComponent();
    this.updateForm(JSON.parse(DEFAULT_EMAIL), JSON.parse(DEFAULT_GSM), JSON.parse(DEFAULT_SUBSCRIPTIONS));
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

      alert_started_email: getValue(getValue(subscriptions.value, 'email'),'alert_started'),
      alert_stopped_email: getValue(getValue(subscriptions.value, 'email'),'alert_stopped'),
      alert_started_sms: getValue(getValue(subscriptions.value, 'sms'),'alert_started'),
      alert_stopped_sms: getValue(getValue(subscriptions.value, 'sms'),'alert_stopped')
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
      this.email = results[0] ? results[0] : JSON.parse(DEFAULT_EMAIL);
      this.gsm = results[1] ? results[1] : JSON.parse(DEFAULT_GSM);
      this.subscriptions = results[2] ? results[2] : JSON.parse(DEFAULT_SUBSCRIPTIONS);
      this.email.value = JSON.parse(this.email.value)
      this.gsm.value = JSON.parse(this.gsm.value)
      this.subscriptions.value = JSON.parse(this.subscriptions.value)
      this.updateForm(this.email, this.gsm, this.subscriptions);
      this.loader.display(false);
    });
  }

  prepareEmail(): any {
    const formModel = this.notificationsForm.value;
    let email = {
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
      'sms':{
        'alert_started': formModel.alert_started_sms,
        'alert_stopped': formModel.alert_stopped_sms
      }
    };
  }

  onSubmit() {
    let email = this.prepareEmail();
    this.configService.setOption('notifications', 'email', email);
    let gsm = this.prepareGsm();
    this.configService.setOption('notifications', 'gsm', gsm);
    let subcriptions = this.prepareSubscriptions();
    this.configService.setOption('notifications', 'subscriptions', subcriptions);
  }
}

