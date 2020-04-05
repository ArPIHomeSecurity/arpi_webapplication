import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { forkJoin } from 'rxjs';

import { FormBuilder, FormGroup } from '@angular/forms';

import { ConfigurationBaseComponent } from '../../configuration-base/configuration-base.component';
import { ConfigurationService, EventService, LoaderService, MonitoringService } from '../../services';
import { Option, DEFAULT_EMAIL, DEFAULT_GSM, DEFAULT_SUBSCRIPTIONS } from '../../models';
import { getValue } from '../../utils';

const scheduleMicrotask = Promise.resolve(null);


@Component({
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
    super(eventService, loader, monitoringService);
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

    forkJoin({
      email: this.configService.getOption('notifications', 'email'),
      gsm: this.configService.getOption('notifications', 'gsm'),
      subscriptions: this.configService.getOption('notifications', 'subscriptions')
    })
    .subscribe(results => {
        this.email = results.email ? results.email : DEFAULT_EMAIL;
        this.gsm = results.gsm ? results.gsm : DEFAULT_GSM;
        this.subscriptions = results.subscriptions ? results.subscriptions : DEFAULT_SUBSCRIPTIONS;
        this.email.value = JSON.parse(this.email.value);
        this.gsm.value = JSON.parse(this.gsm.value);
        this.subscriptions.value = JSON.parse(this.subscriptions.value);
        this.updateForm(this.email, this.gsm, this.subscriptions);
        this.loader.display(false);
      }
    );
  }

  prepareEmail(): any {
    const formModel = this.notificationsForm.value;
    const email: any = {
      smtp_username: formModel.smtp_username,
      email_address: formModel.email_address,
    };

    if (formModel.smtp_password) {
      email.smtp_password = formModel.smtp_password;
    }

    return email;
  }

  prepareGsm(): any {
    const formModel = this.notificationsForm.value;
    return {
      pin_code: formModel.pin_code,
      phone_number: formModel.phone_number
    };
  }

  prepareSubscriptions(): any {
    const formModel = this.notificationsForm.value;
    return {
      email: {
        alert_started: formModel.alert_started_email,
        alert_stopped: formModel.alert_stopped_email,
      },
      sms: {
        alert_started: formModel.alert_started_sms,
        alert_stopped: formModel.alert_stopped_sms
      }
    };
  }

  onSubmit() {
    const email = this.prepareEmail();
    const gsm = this.prepareGsm();
    const subcriptions = this.prepareSubscriptions();
    forkJoin({
      email: this.configService.setOption('notifications', 'email', email),
      gsm: this.configService.setOption('notifications', 'gsm', gsm),
      subscriptions: this.configService.setOption('notifications', 'subscriptions', subcriptions)
    })
    .subscribe(_ => this.updateComponent());
  }
}

