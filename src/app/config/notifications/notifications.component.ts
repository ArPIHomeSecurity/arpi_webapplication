import { Component, Input, OnInit, OnDestroy, Inject } from '@angular/core';
import { forkJoin } from 'rxjs';

import { FormBuilder, FormGroup } from '@angular/forms';

import { ConfigurationBaseComponent } from '../../configuration-base/configuration-base.component';
import { Option, DEFAULT_NOTIFICATION_EMAIL, DEFAULT_NOTIFICATION_GSM, DEFAULT_NOTIFICATION_SUBSCRIPTIONS } from '../../models';
import { ConfigurationService, EventService, LoaderService, MonitoringService } from 'src/app/services';
import { getValue } from '../../utils';

const scheduleMicrotask = Promise.resolve(null);


@Component({
  templateUrl: 'notifications.component.html',
  styleUrls: ['notifications.component.scss']
})


export class NotificationsComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  @Input() onlyAlerting = false;
  notificationsForm: FormGroup;
  email: Option = null;
  gsm: Option = null;
  subscriptions: Option = null;

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
    this.updateForm(DEFAULT_NOTIFICATION_EMAIL, DEFAULT_NOTIFICATION_GSM, DEFAULT_NOTIFICATION_SUBSCRIPTIONS);
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
        this.email = getValue(results, 'email', DEFAULT_NOTIFICATION_EMAIL);
        this.gsm = getValue(results, 'gsm', DEFAULT_NOTIFICATION_GSM);
        this.subscriptions = getValue(results, 'subscriptions', DEFAULT_NOTIFICATION_SUBSCRIPTIONS);
        
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

