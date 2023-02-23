import { Component, Input, OnInit, OnDestroy, Inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';

import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

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
  notificationsForm: UntypedFormGroup;
  email: Option = null;
  gsm: Option = null;
  subscriptions: Option = null;

  constructor(
    @Inject('ConfigurationService') private configService: ConfigurationService,
    @Inject('EventService') public eventService: EventService,
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,

    private fb: UntypedFormBuilder,
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
      smtpUsername: getValue(email.value, 'smtp_username'),
      smtpPassword: getValue(email.value, 'smtp_password'),
      smtpHostname: getValue(email.value, 'smtp_hostname'),
      smtpPort: getValue(email.value, 'smtp_port'),
      email1Address: getValue(email.value, 'email1_address'),
      email2Address: getValue(email.value, 'email2_address'),

      pinCode: getValue(gsm.value, 'pin_code'),
      phoneNumber: getValue(gsm.value, 'phone_number'),

      alertStartedEmail1: getValue(getValue(subscriptions.value, 'email1'), 'alert_started'),
      alertStoppedEmail1: getValue(getValue(subscriptions.value, 'email1'), 'alert_stopped'),
      powerOutageStartedEmail1: getValue(getValue(subscriptions.value, 'email1'), 'power_outage_started'),
      powerOutageStoppedEmail1: getValue(getValue(subscriptions.value, 'email1'), 'power_outage_stopped'),
      alertStartedEmail2: getValue(getValue(subscriptions.value, 'email2'), 'alert_started'),
      alertStoppedEmail2: getValue(getValue(subscriptions.value, 'email2'), 'alert_stopped'),
      powerOutageStartedEmail2: getValue(getValue(subscriptions.value, 'email2'), 'power_outage_started'),
      powerOutageStoppedEmail2: getValue(getValue(subscriptions.value, 'email2'), 'power_outage_stopped'),
      alertStartedSms: getValue(getValue(subscriptions.value, 'sms'), 'alert_started'),
      alertStoppedSms: getValue(getValue(subscriptions.value, 'sms'), 'alert_stopped'),
      powerOutageStartedSms: getValue(getValue(subscriptions.value, 'sms'), 'power_outage_started'),
      powerOutageStoppedSms: getValue(getValue(subscriptions.value, 'sms'), 'power_outage_stopped')
    });
  }

  updateComponent() {
    forkJoin({
      email: this.configService.getOption('notifications', 'email'),
      gsm: this.configService.getOption('notifications', 'gsm'),
      subscriptions: this.configService.getOption('notifications', 'subscriptions')
    })
    .pipe(finalize(() => this.loader.display(false)))
    .subscribe(results => {
        this.email = getValue(results, 'email', DEFAULT_NOTIFICATION_EMAIL);
        this.gsm = getValue(results, 'gsm', DEFAULT_NOTIFICATION_GSM);
        this.subscriptions = getValue(results, 'subscriptions', DEFAULT_NOTIFICATION_SUBSCRIPTIONS);

        this.updateForm(this.email, this.gsm, this.subscriptions);
        this.loader.display(false);
        this.loader.disable(false);
      }
    );
  }

  prepareEmail(): any {
    const formModel = this.notificationsForm.value;
    const email: any = {
      smtp_username: formModel.smtpUsername,
      smtp_hostname: formModel.smtpHostname,
      smtp_port: formModel.smtpPort,
      email1_address: formModel.email1Address,
      email2_address: formModel.email2Address
    };

    if (formModel.smtpPassword) {
      email.smtp_password = formModel.smtpPassword;
    }

    return email;
  }

  prepareGsm(): any {
    const formModel = this.notificationsForm.value;
    return {
      pin_code: formModel.pinCode,
      phone_number: formModel.phoneNumber
    };
  }

  prepareSubscriptions(): any {
    const formModel = this.notificationsForm.value;
    return {
      email1: {
        alert_started: formModel.alertStartedEmail1,
        alert_stopped: formModel.alertStoppedEmail1,
        power_outage_started: formModel.powerOutageStartedEmail1,
        power_outage_stopped: formModel.powerOutageStoppedEmail1
      },
      email2: {
        alert_started: formModel.alertStartedEmail2,
        alert_stopped: formModel.alertStoppedEmail2,
        power_outage_started: formModel.powerOutageStartedEmail2,
        power_outage_stopped: formModel.powerOutageStoppedEmail2
      },
      sms: {
        alert_started: formModel.alertStartedSms,
        alert_stopped: formModel.alertStoppedSms,
        power_outage_started: formModel.powerOutageStartedSms,
        power_outage_stopped: formModel.powerOutageStoppedSms
      }
    };
  }

  onSubmit() {
    const email = this.prepareEmail();
    const gsm = this.prepareGsm();
    const subcriptions = this.prepareSubscriptions();
    this.loader.disable(true);
    forkJoin({
      email: this.configService.setOption('notifications', 'email', email),
      gsm: this.configService.setOption('notifications', 'gsm', gsm),
      subscriptions: this.configService.setOption('notifications', 'subscriptions', subcriptions)
    })
    .subscribe(_ => this.updateComponent());
  }
}

