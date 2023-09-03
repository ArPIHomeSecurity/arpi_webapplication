import { Component, Input, OnInit, OnDestroy, Inject, ViewChild, TemplateRef } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ConfigurationBaseComponent } from '../../configuration-base/configuration-base.component';
import { Option, DEFAULT_NOTIFICATION_SMTP, DEFAULT_NOTIFICATION_GSM, DEFAULT_NOTIFICATION_SUBSCRIPTIONS, DEFAULT_PASSWORD_VALUE } from '../../models';
import { ConfigurationService, EventService, LoaderService, MonitoringService } from 'src/app/services';
import { getValue } from '../../utils';
import { environment } from 'src/environments/environment';

const scheduleMicrotask = Promise.resolve(null);


@Component({
  templateUrl: 'notifications.component.html',
  styleUrls: ['notifications.component.scss']
})


export class NotificationsComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  @ViewChild('snackbarTemplateEmail') snackbarTemplateEmail: TemplateRef<any>;
  @ViewChild('snackbarTemplateSms') snackbarTemplateSms: TemplateRef<any>;
  @Input() onlyAlerting = false;
  notificationsForm: UntypedFormGroup;
  smtpEnabled: boolean = null;
  gsmEnabled: boolean = null;
  smtp: Option = null;
  gsm: Option = null;
  subscriptions: Option = null;

  testEmailResult: any = {}
  testSmsResult: any = {}

  constructor(
    @Inject('ConfigurationService') private configService: ConfigurationService,
    @Inject('EventService') public eventService: EventService,
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,

    private snackBar: MatSnackBar,
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
    this.updateForm(DEFAULT_NOTIFICATION_SMTP, DEFAULT_NOTIFICATION_GSM, DEFAULT_NOTIFICATION_SUBSCRIPTIONS);
  }

  ngOnDestroy() {
    super.destroy();
  }

  updateForm(smtp: Option, gsm: Option, subscriptions: Option) {
//    console.log('Email', this.email);
//    console.log('GSM', this.gsm);
//    console.log('Subscriptions', this.subscriptions);
    this.smtpEnabled = getValue(smtp.value, 'enabled')
    this.gsmEnabled = getValue(gsm.value, 'enabled')

    this.notificationsForm = this.fb.group({
      smtpUsername: getValue(smtp.value, 'smtp_username'),
      smtpPassword: getValue(smtp.value, 'smtp_password'),
      smtpHostname: getValue(smtp.value, 'smtp_hostname'),
      smtpPort: getValue(smtp.value, 'smtp_port'),
      email1Address: getValue(smtp.value, 'email1_address'),
      email2Address: getValue(smtp.value, 'email2_address'),

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
      smtp: this.configService.getOption('notifications', 'smtp'),
      gsm: this.configService.getOption('notifications', 'gsm'),
      subscriptions: this.configService.getOption('notifications', 'subscriptions')
    })
    .pipe(finalize(() => this.loader.display(false)))
    .subscribe(results => {
        this.smtp = getValue(results, 'smtp', DEFAULT_NOTIFICATION_SMTP);
        this.gsm = getValue(results, 'gsm', DEFAULT_NOTIFICATION_GSM);
        this.subscriptions = getValue(results, 'subscriptions', DEFAULT_NOTIFICATION_SUBSCRIPTIONS);

        this.updateForm(this.smtp, this.gsm, this.subscriptions);
        this.loader.display(false);
        this.loader.disable(false);
      }
    );
  }

  prepareSmtp(): any {
    const formModel = this.notificationsForm.value;
    const smtp: any = {
      enabled: this.smtpEnabled,
      smtp_username: formModel.smtpUsername,
      smtp_hostname: formModel.smtpHostname,
      smtp_port: formModel.smtpPort,
      email1_address: formModel.email1Address,
      email2_address: formModel.email2Address
    };

    if (formModel.smtpPassword != DEFAULT_PASSWORD_VALUE) {
      smtp.smtp_password = formModel.smtpPassword;
    }

    return smtp;
  }

  prepareGsm(): any {
    const formModel = this.notificationsForm.value;
    return {
      enabled: this.gsmEnabled,
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

  onEnableSmtp() {
    this.smtpEnabled = true;
  }

  onDisableSmtp() {
    this.smtpEnabled = false;
  }

  onSendTestEmail(){
    this.testEmailResult = {};
    this.testSmsResult = {};
    this.configService.sendTestEmail()
      .subscribe(response => {
        this.testEmailResult = response;
        this.snackBar.openFromTemplate(this.snackbarTemplateEmail, {duration: environment.snackDuration});
      },
      error => {
        this.testEmailResult = error.error;
        this.snackBar.openFromTemplate(this.snackbarTemplateEmail, {duration: environment.snackDuration});
      })
  }

  onEnableGsm() {
    this.gsmEnabled = true;
  }

  onDisableGsm() {
    this.gsmEnabled = false;
  }

  onPasswordFocus() {
    const passwordControl = this.notificationsForm.get('smtpPassword');

    if (passwordControl.value == DEFAULT_PASSWORD_VALUE) {
      passwordControl.markAsTouched();
      passwordControl.setValue("");
    }
  }
  
  onPasswordBlur() {
    const passwordControl = this.notificationsForm.get('smtpPassword');
  
    // Check if the user has changed the password field's value.
    if (!passwordControl.dirty) {
      // If the user didn't change it, restore the initial value.
      passwordControl.setValue(DEFAULT_PASSWORD_VALUE);
    }
  }

  onSendTestSMS(){
    this.testEmailResult = {};
    this.testSmsResult = {};
    this.configService.sendTestSMS()
      .subscribe(response => {
        this.testSmsResult = response;
        this.snackBar.openFromTemplate(this.snackbarTemplateSms, {duration: environment.snackDuration});
      },
      error => {
        this.testSmsResult = error.error;
        this.snackBar.openFromTemplate(this.snackbarTemplateSms, {duration: environment.snackDuration});
      })
  }

  onSubmit() {
    const smtp = this.prepareSmtp();
    const gsm = this.prepareGsm();
    const subscriptions = this.prepareSubscriptions();
    this.loader.disable(true);
    forkJoin({
      smtp: this.configService.setOption('notifications', 'smtp', smtp),
      gsm: this.configService.setOption('notifications', 'gsm', gsm),
      subscriptions: this.configService.setOption('notifications', 'subscriptions', subscriptions)
    })
    .subscribe(_ => this.updateComponent());
  }
}

