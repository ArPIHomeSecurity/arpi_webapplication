import { Component, Input, OnInit, OnDestroy, Inject, ViewChild, TemplateRef } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ConfigurationBaseComponent } from '@app/configuration-base/configuration-base.component';
import { Option, DEFAULT_NOTIFICATION_SMTP, DEFAULT_NOTIFICATION_GSM, DEFAULT_NOTIFICATION_SUBSCRIPTIONS, DEFAULT_PASSWORD_VALUE, MONITORING_STATE } from '@app/models';
import { ConfigurationService, EventService, LoaderService, MonitoringService } from '@app/services';
import { getValue } from '@app/utils';
import { environment } from '@environments/environment';
import { SmsMessagesDialogComponent } from './sms-messages.component';
import { MatDialog } from '@angular/material/dialog';

const scheduleMicrotask = Promise.resolve(null);


@Component({
  templateUrl: 'notifications.component.html',
  styleUrls: ['notifications.component.scss']
})


export class NotificationsComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  @ViewChild('snackbarTemplateEmail') snackbarTemplateEmail: TemplateRef<any>;
  @ViewChild('snackbarTemplateSms') snackbarTemplateSms: TemplateRef<any>;
  @ViewChild('snackbarTemplateCall') snackbarTemplateCall: TemplateRef<any>;
  @Input() onlyAlerting = false;

  smtpForm: FormGroup;
  gsmForm: FormGroup;
  subscriptionsForm: FormGroup;

  testEmailResult: any = {}
  testingEmail = false;
  testSmsResult: any = {}
  testingSms = false;
  testCallResult: any = {}
  testingCall = false;

  constructor(
    @Inject('ConfigurationService') private configService: ConfigurationService,
    @Inject('EventService') public eventService: EventService,
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,

    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    public dialog: MatDialog
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

    this.smtpForm = this.fb.group({
      smtpUsername: getValue(smtp.value, 'smtp_username'),
      smtpPassword: getValue(smtp.value, 'smtp_password'),
      smtpHostname: getValue(smtp.value, 'smtp_hostname'),
      smtpPort: getValue(smtp.value, 'smtp_port'),
      emailAddress1: getValue(smtp.value, 'email_address_1'),
      emailAddress2: getValue(smtp.value, 'email_address_2'),
      smtpEnabled: getValue(smtp.value, 'enabled')
    });
      
    this.gsmForm = this.fb.group({
      pinCode: getValue(gsm.value, 'pin_code'),
      phoneNumber1: getValue(gsm.value, 'phone_number_1'),
      phoneNumber2: getValue(gsm.value, 'phone_number_2'),
      gsmEnabled: getValue(gsm.value, 'enabled')
    });
      
    this.subscriptionsForm = this.fb.group({
      alertStartedCall1: getValue(getValue(subscriptions.value, 'call1'), 'alert_started'),
      alertStartedCall2: getValue(getValue(subscriptions.value, 'call2'), 'alert_started'),

      alertStartedEmail1: getValue(getValue(subscriptions.value, 'email1'), 'alert_started'),
      alertStoppedEmail1: getValue(getValue(subscriptions.value, 'email1'), 'alert_stopped'),
      powerOutageStartedEmail1: getValue(getValue(subscriptions.value, 'email1'), 'power_outage_started'),
      powerOutageStoppedEmail1: getValue(getValue(subscriptions.value, 'email1'), 'power_outage_stopped'),

      alertStartedEmail2: getValue(getValue(subscriptions.value, 'email2'), 'alert_started'),
      alertStoppedEmail2: getValue(getValue(subscriptions.value, 'email2'), 'alert_stopped'),
      powerOutageStartedEmail2: getValue(getValue(subscriptions.value, 'email2'), 'power_outage_started'),
      powerOutageStoppedEmail2: getValue(getValue(subscriptions.value, 'email2'), 'power_outage_stopped'),

      alertStartedSms1: getValue(getValue(subscriptions.value, 'sms1'), 'alert_started'),
      alertStoppedSms1: getValue(getValue(subscriptions.value, 'sms1'), 'alert_stopped'),
      powerOutageStartedSms1: getValue(getValue(subscriptions.value, 'sms1'), 'power_outage_started'),
      powerOutageStoppedSms1: getValue(getValue(subscriptions.value, 'sms1'), 'power_outage_stopped'),

      alertStartedSms2: getValue(getValue(subscriptions.value, 'sms2'), 'alert_started'),
      alertStoppedSms2: getValue(getValue(subscriptions.value, 'sms2'), 'alert_stopped'),
      powerOutageStartedSms2: getValue(getValue(subscriptions.value, 'sms2'), 'power_outage_started'),
      powerOutageStoppedSms2: getValue(getValue(subscriptions.value, 'sms2'), 'power_outage_stopped')
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
        this.updateForm(
          getValue(results, 'smtp', DEFAULT_NOTIFICATION_SMTP),
          getValue(results, 'gsm', DEFAULT_NOTIFICATION_GSM),
          getValue(results, 'subscriptions', DEFAULT_NOTIFICATION_SUBSCRIPTIONS)
        );
        this.loader.display(false);
        this.loader.disable(false);
      }
    );
  }

  prepareSmtp(): any {
    const formModel = this.smtpForm.value;
    const smtp: any = {
      enabled: formModel.smtpEnabled,
      smtp_username: formModel.smtpUsername,
      smtp_hostname: formModel.smtpHostname,
      smtp_port: formModel.smtpPort,
      email_address_1: formModel.emailAddress1,
      email_address_2: formModel.emailAddress2
    };

    if (formModel.smtpPassword != DEFAULT_PASSWORD_VALUE) {
      smtp.smtp_password = formModel.smtpPassword;
    }

    return smtp;
  }

  prepareGsm(): any {
    const formModel = this.gsmForm.value;
    return {
      enabled: formModel.gsmEnabled,
      pin_code: formModel.pinCode,
      phone_number_1: formModel.phoneNumber1,
      phone_number_2: formModel.phoneNumber2
    };
  }

  prepareSubscriptions(): any {
    const formModel = this.subscriptionsForm.value;
    return {
      call1: {
        alert_started: formModel.alertStartedCall1
      },
      call2: {
        alert_started: formModel.alertStartedCall2
      },
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
      sms1: {
        alert_started: formModel.alertStartedSms1,
        alert_stopped: formModel.alertStoppedSms1,
        power_outage_started: formModel.powerOutageStartedSms1,
        power_outage_stopped: formModel.powerOutageStoppedSms1
      },
      sms2: {
        alert_started: formModel.alertStartedSms2,
        alert_stopped: formModel.alertStoppedSms2,
        power_outage_started: formModel.powerOutageStartedSms2,
        power_outage_stopped: formModel.powerOutageStoppedSms2
      }
    };
  }

  canSaveSmtp() {
    return (
      this.monitoringState == MONITORING_STATE.READY &&
      this.smtpForm.valid && !this.smtpForm.pristine
    );
  }

  canTestSmtp() {
    return (
      this.monitoringState == MONITORING_STATE.READY &&
      this.smtpForm.valid && !this.smtpForm.touched &&
      this.smtpForm.value.smtpHostname && this.smtpForm.value.smtpPort &&
      this.smtpForm.value.smtpUsername && this.smtpForm.value.smtpPassword &&
      (this.smtpForm.value.emailAddress1 || this.smtpForm.value.emailAddress2) &&
      this.smtpForm.value.smtpEnabled
    );
  }

  onSendTestEmail(){
    this.testingEmail = true;

    this.gsmForm.disable();
    this.smtpForm.disable();
    this.subscriptionsForm.disable();

    this.testEmailResult = {};
    this.testSmsResult = {};
    this.testCallResult = {};

    this.configService.sendTestEmail()
      .pipe(finalize(() => {
        this.testingEmail = false;
        this.gsmForm.enable();
        this.smtpForm.enable();
        this.subscriptionsForm.enable();
      }))
      .subscribe({
        next: response => {
          this.testEmailResult = response;
          this.snackBar.openFromTemplate(this.snackbarTemplateEmail, {duration: environment.snackDuration});
        },
        error: error => {
          this.testEmailResult = error.error;
          this.snackBar.openFromTemplate(this.snackbarTemplateEmail, {duration: environment.snackDuration});
        }
      });
  }

  canSaveGsm() {
    return (
      this.monitoringState == MONITORING_STATE.READY &&
      this.gsmForm.valid && !this.gsmForm.pristine
    );
  }

  canTestGsm() {
    return this.gsmForm.valid &&
      this.gsmForm.value.pinCode && (this.gsmForm.value.phoneNumber1 || this.gsmForm.value.phoneNumber2) &&
      this.gsmForm.value.gsmEnabled;
  }

  onSendTestSMS(){
    this.testingSms = true;

    this.gsmForm.disable();
    this.smtpForm.disable();
    this.subscriptionsForm.disable();

    this.testEmailResult = {};
    this.testSmsResult = {};
    this.testCallResult = {};

    this.configService.sendTestSMS()
      .pipe(finalize(() => {
        this.testingSms = false;
        this.gsmForm.enable();
        this.smtpForm.enable();
        this.subscriptionsForm.enable();
      }))
      .subscribe({
        next: response => {
          this.testSmsResult = response;
          this.snackBar.openFromTemplate(this.snackbarTemplateSms, {duration: environment.snackDuration});
        },
        error: error => {
          this.testSmsResult = error.error;
          this.snackBar.openFromTemplate(this.snackbarTemplateSms, {duration: environment.snackDuration});
        }
      });
  }

  onTestCall() {
    this.testingCall = true;
    
    this.gsmForm.disable();
    this.smtpForm.disable();
    this.subscriptionsForm.disable();

    this.testEmailResult = {};
    this.testSmsResult = {};
    this.testCallResult = {};

    this.configService.doTestCall()
      .pipe(finalize(() => {
        this.testingCall = false;
        this.gsmForm.enable();
        this.smtpForm.enable();
        this.subscriptionsForm.enable();
      }))
      .subscribe({
        next: response => {
          this.testCallResult = response;
          this.snackBar.openFromTemplate(this.snackbarTemplateCall, { duration: environment.snackDuration });
        },
        error: error => {
          this.testCallResult = error.error;
          this.snackBar.openFromTemplate(this.snackbarTemplateCall, { duration: environment.snackDuration });
        }
      });
  }

  onShowSmsMessages() {
    this.dialog.open(SmsMessagesDialogComponent, {
      width: '500px',
    });
  }

  onPasswordFocus() {
    const passwordControl = this.smtpForm.get('smtpPassword');

    if (passwordControl.value == DEFAULT_PASSWORD_VALUE) {
      passwordControl.markAsTouched();
      passwordControl.setValue("");
    }
  }
  
  onPasswordBlur() {
    const passwordControl = this.smtpForm.get('smtpPassword');
  
    // Check if the user has changed the password field's value.
    if (!passwordControl.dirty) {
      // If the user didn't change it, restore the initial value.
      passwordControl.setValue(DEFAULT_PASSWORD_VALUE);
    }
  }

  onSubmitSmtp() {
    const smtp = this.prepareSmtp();
    this.loader.disable(true);
    this.configService.setOption('notifications', 'smtp', smtp)
      .subscribe(_ => this.updateComponent());
  }

  onSubmitGsm() {
    const gsm = this.prepareGsm();
    this.loader.disable(true);
    this.configService.setOption('notifications', 'gsm', gsm)
      .subscribe(_ => this.updateComponent());
  }

  onSubmitSubscriptions() {
    const subscriptions = this.prepareSubscriptions();
    this.loader.disable(true);
    this.configService.setOption('notifications', 'subscriptions', subscriptions)
      .subscribe(_ => this.updateComponent());
  }
}
