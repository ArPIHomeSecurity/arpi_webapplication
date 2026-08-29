import { Component, Inject, Input, OnDestroy, OnInit, TemplateRef, ViewChild } from "@angular/core"
import { FormBuilder, FormGroup } from "@angular/forms"
import { MatSnackBar } from "@angular/material/snack-bar"

import { forkJoin } from "rxjs"
import { finalize } from "rxjs/operators"

import { MatDialog } from "@angular/material/dialog"
import { ConfigurationBaseComponent } from "@app/configuration-base/configuration-base.component"
import {
  DEFAULT_NOTIFICATION_GSM,
  DEFAULT_NOTIFICATION_SMTP,
  DEFAULT_NOTIFICATION_SUBSCRIPTIONS,
  DEFAULT_PASSWORD_VALUE,
  MONITORING_STATE,
  Option
} from "@app/models"
import { ConfigurationService, EventService, LoaderService, MonitoringService } from "@app/services"
import { getValue } from "@app/utils"
import { environment } from "@environments/environment"
import { SmsMessagesDialogComponent } from "./sms-messages.component"

const scheduleMicrotask = Promise.resolve(null)

@Component({
  templateUrl: "notifications.component.html",
  styleUrls: ["notifications.component.scss"],
  standalone: false
})
export class NotificationsComponent
  extends ConfigurationBaseComponent
  implements OnInit, OnDestroy
{
  @ViewChild("snackbarTemplateEmail") snackbarTemplateEmail: TemplateRef<any>
  @ViewChild("snackbarTemplateSms") snackbarTemplateSms: TemplateRef<any>
  @ViewChild("snackbarTemplateCall") snackbarTemplateCall: TemplateRef<any>
  @Input() onlyAlerting = false

  smtpForm: FormGroup
  gsmForm: FormGroup
  subscriptionsForm: FormGroup

  testEmailResult: any = {}
  testingEmail = false
  testSmsResult: any = {}
  testingSms = false
  testCallResult: any = {}
  testingCall = false

  readonly subscriptionChannels = [
    { key: "email1", label: $localize`:@@notifications send email1:Send Email 1` },
    { key: "email2", label: $localize`:@@notifications send email2:Send Email 2` },
    { key: "sms1", label: $localize`:@@notifications send sms1:Send SMS 1` },
    { key: "sms2", label: $localize`:@@notifications send sms2:Send SMS 2` },
    { key: "call1", label: $localize`:@@notifications call 1:Call 1` },
    { key: "call2", label: $localize`:@@notifications call 2:Call 2` }
  ]

  // notification types accepted by the backend, detected from the loaded configuration
  subscriptionTypes: string[] = []

  private readonly subscriptionTypeLabels: Record<string, string> = {
    alert_started: $localize`:@@notifications alert started:Alert started`,
    alert_stopped: $localize`:@@notifications alert stopped:Alert stopped`,
    power_outage_started: $localize`:@@notifications power outage started:Power outage started`,
    power_outage_stopped: $localize`:@@notifications power outage stopped:Power outage stopped`,
    local_network_issue_started: $localize`:@@notifications local network issue started:Local network issue started`,
    local_network_issue_stopped: $localize`:@@notifications local network issue stopped:Local network issue stopped`,
    internet_issue_started: $localize`:@@notifications internet issue started:Internet issue started`,
    internet_issue_stopped: $localize`:@@notifications internet issue stopped:Internet issue stopped`
  }

  constructor(
    @Inject("ConfigurationService") private configService: ConfigurationService,
    @Inject("EventService") public eventService: EventService,
    @Inject("LoaderService") public loader: LoaderService,
    @Inject("MonitoringService") public monitoringService: MonitoringService,

    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    public dialog: MatDialog
  ) {
    super(eventService, loader, monitoringService)
  }

  ngOnInit() {
    super.initialize()

    // avoid ExpressionChangedAfterItHasBeenCheckedError
    // https://github.com/angular/angular/issues/17572#issuecomment-323465737
    scheduleMicrotask.then(() => {
      this.loader.display(true)
    })
    this.updateComponent()
    this.updateForm(
      DEFAULT_NOTIFICATION_SMTP,
      DEFAULT_NOTIFICATION_GSM,
      DEFAULT_NOTIFICATION_SUBSCRIPTIONS
    )
  }

  ngOnDestroy() {
    super.destroy()
  }

  subscriptionControl(channel: string, type: string): string {
    return `${channel}_${type}`
  }

  subscriptionTypeLabel(type: string): string {
    return (
      this.subscriptionTypeLabels[type] ??
      type.replace(/_/g, " ").replace(/^./, first => first.toUpperCase())
    )
  }

  /**
   * The backend always returns every accepted notification type for each channel,
   * so the response defines which subscriptions can be configured.
   */
  private detectSubscriptionTypes(subscriptions: Record<string, unknown>): string[] {
    const types: string[] = []
    for (const channel of this.subscriptionChannels) {
      for (const type of Object.keys(getValue(subscriptions, channel.key, {}))) {
        if (!types.includes(type)) {
          types.push(type)
        }
      }
    }

    return types.length ? types : Object.keys(DEFAULT_NOTIFICATION_SUBSCRIPTIONS.value.email1)
  }

  updateForm(smtp: Option, gsm: Option, subscriptions: Option) {
    //    console.log('Email', this.email);
    //    console.log('GSM', this.gsm);
    //    console.log('Subscriptions', this.subscriptions);

    this.smtpForm = this.fb.group({
      smtpUsername: getValue(smtp.value, "smtp_username"),
      smtpPassword: getValue(smtp.value, "smtp_password"),
      smtpHostname: getValue(smtp.value, "smtp_hostname"),
      smtpPort: getValue(smtp.value, "smtp_port"),
      emailAddress1: getValue(smtp.value, "email_address_1"),
      emailAddress2: getValue(smtp.value, "email_address_2"),
      smtpEnabled: getValue(smtp.value, "enabled")
    })

    this.gsmForm = this.fb.group({
      pinCode: getValue(gsm.value, "pin_code"),
      phoneNumber1: getValue(gsm.value, "phone_number_1"),
      phoneNumber2: getValue(gsm.value, "phone_number_2"),
      gsmEnabled: getValue(gsm.value, "enabled")
    })

    this.subscriptionTypes = this.detectSubscriptionTypes(subscriptions.value)

    const subscriptionControls: Record<string, boolean> = {}
    for (const channel of this.subscriptionChannels) {
      const channelValue = getValue(subscriptions.value, channel.key, {})
      for (const type of this.subscriptionTypes) {
        subscriptionControls[this.subscriptionControl(channel.key, type)] =
          getValue(channelValue, type, false) === true
      }
    }

    this.subscriptionsForm = this.fb.group(subscriptionControls)
  }

  updateComponent() {
    forkJoin({
      smtp: this.configService.getOption("notifications", "smtp"),
      gsm: this.configService.getOption("notifications", "gsm"),
      subscriptions: this.configService.getOption("notifications", "subscriptions")
    })
      .pipe(finalize(() => this.loader.display(false)))
      .subscribe(results => {
        this.updateForm(
          getValue(results, "smtp", DEFAULT_NOTIFICATION_SMTP),
          getValue(results, "gsm", DEFAULT_NOTIFICATION_GSM),
          getValue(results, "subscriptions", DEFAULT_NOTIFICATION_SUBSCRIPTIONS)
        )
        this.loader.display(false)
        this.loader.disable(false)
      })
  }

  prepareSmtp(): any {
    const formModel = this.smtpForm.value
    const smtp: any = {
      enabled: formModel.smtpEnabled,
      smtp_username: formModel.smtpUsername,
      smtp_hostname: formModel.smtpHostname,
      smtp_port: formModel.smtpPort,
      email_address_1: formModel.emailAddress1,
      email_address_2: formModel.emailAddress2
    }

    if (formModel.smtpPassword != DEFAULT_PASSWORD_VALUE) {
      smtp.smtp_password = formModel.smtpPassword
    }

    return smtp
  }

  prepareGsm(): any {
    const formModel = this.gsmForm.value
    return {
      enabled: formModel.gsmEnabled,
      pin_code: formModel.pinCode,
      phone_number_1: formModel.phoneNumber1,
      phone_number_2: formModel.phoneNumber2
    }
  }

  prepareSubscriptions(): any {
    const formModel = this.subscriptionsForm.value
    const subscriptions: Record<string, Record<string, boolean>> = {}

    // only send the types detected on the backend, unknown keys are rejected
    for (const channel of this.subscriptionChannels) {
      const channelSubscriptions: Record<string, boolean> = {}
      for (const type of this.subscriptionTypes) {
        channelSubscriptions[type] = formModel[this.subscriptionControl(channel.key, type)] === true
      }
      subscriptions[channel.key] = channelSubscriptions
    }

    return subscriptions
  }

  canSaveSmtp() {
    return (
      this.monitoringState == MONITORING_STATE.READY &&
      this.smtpForm.valid &&
      !this.smtpForm.pristine
    )
  }

  canTestSmtp() {
    return (
      this.monitoringState == MONITORING_STATE.READY &&
      this.smtpForm.valid &&
      !this.smtpForm.touched &&
      this.smtpForm.value.smtpHostname &&
      this.smtpForm.value.smtpPort &&
      this.smtpForm.value.smtpUsername &&
      this.smtpForm.value.smtpPassword &&
      (this.smtpForm.value.emailAddress1 || this.smtpForm.value.emailAddress2) &&
      this.smtpForm.value.smtpEnabled
    )
  }

  onSendTestEmail() {
    this.testingEmail = true

    this.gsmForm.disable()
    this.smtpForm.disable()
    this.subscriptionsForm.disable()

    this.testEmailResult = {}
    this.testSmsResult = {}
    this.testCallResult = {}

    this.configService
      .sendTestEmail()
      .pipe(
        finalize(() => {
          this.testingEmail = false
          this.gsmForm.enable()
          this.smtpForm.enable()
          this.subscriptionsForm.enable()
        })
      )
      .subscribe({
        next: response => {
          this.testEmailResult = response
          this.snackBar.openFromTemplate(this.snackbarTemplateEmail, {
            duration: environment.snackDuration
          })
        },
        error: error => {
          this.testEmailResult = error.error
          this.snackBar.openFromTemplate(this.snackbarTemplateEmail, {
            duration: environment.snackDuration
          })
        }
      })
  }

  canSaveGsm() {
    return (
      this.monitoringState == MONITORING_STATE.READY && this.gsmForm.valid && !this.gsmForm.pristine
    )
  }

  canTestGsm() {
    return (
      this.gsmForm.valid &&
      this.gsmForm.value.pinCode &&
      (this.gsmForm.value.phoneNumber1 || this.gsmForm.value.phoneNumber2) &&
      this.gsmForm.value.gsmEnabled
    )
  }

  onSendTestSMS() {
    this.testingSms = true

    this.gsmForm.disable()
    this.smtpForm.disable()
    this.subscriptionsForm.disable()

    this.testEmailResult = {}
    this.testSmsResult = {}
    this.testCallResult = {}

    this.configService
      .sendTestSMS()
      .pipe(
        finalize(() => {
          this.testingSms = false
          this.gsmForm.enable()
          this.smtpForm.enable()
          this.subscriptionsForm.enable()
        })
      )
      .subscribe({
        next: response => {
          this.testSmsResult = response
          this.snackBar.openFromTemplate(this.snackbarTemplateSms, {
            duration: environment.snackDuration
          })
        },
        error: error => {
          this.testSmsResult = error.error
          this.snackBar.openFromTemplate(this.snackbarTemplateSms, {
            duration: environment.snackDuration
          })
        }
      })
  }

  onTestCall() {
    this.testingCall = true

    this.gsmForm.disable()
    this.smtpForm.disable()
    this.subscriptionsForm.disable()

    this.testEmailResult = {}
    this.testSmsResult = {}
    this.testCallResult = {}

    this.configService
      .doTestCall()
      .pipe(
        finalize(() => {
          this.testingCall = false
          this.gsmForm.enable()
          this.smtpForm.enable()
          this.subscriptionsForm.enable()
        })
      )
      .subscribe({
        next: response => {
          this.testCallResult = response
          this.snackBar.openFromTemplate(this.snackbarTemplateCall, {
            duration: environment.snackDuration
          })
        },
        error: error => {
          this.testCallResult = error.error
          this.snackBar.openFromTemplate(this.snackbarTemplateCall, {
            duration: environment.snackDuration
          })
        }
      })
  }

  onShowSmsMessages() {
    this.dialog.open(SmsMessagesDialogComponent, {
      width: "500px"
    })
  }

  onPasswordFocus() {
    const passwordControl = this.smtpForm.get("smtpPassword")

    if (passwordControl.value == DEFAULT_PASSWORD_VALUE) {
      passwordControl.markAsTouched()
      passwordControl.setValue("")
    }
  }

  onPasswordBlur() {
    const passwordControl = this.smtpForm.get("smtpPassword")

    // Check if the user has changed the password field's value.
    if (!passwordControl.dirty) {
      // If the user didn't change it, restore the initial value.
      passwordControl.setValue(DEFAULT_PASSWORD_VALUE)
    }
  }

  onSubmitSmtp() {
    const smtp = this.prepareSmtp()
    this.loader.disable(true)
    this.configService
      .setOption("notifications", "smtp", smtp)
      .subscribe(_ => this.updateComponent())
  }

  onSubmitGsm() {
    const gsm = this.prepareGsm()
    this.loader.disable(true)
    this.configService.setOption("notifications", "gsm", gsm).subscribe(_ => this.updateComponent())
  }

  onSubmitSubscriptions() {
    const subscriptions = this.prepareSubscriptions()
    this.loader.disable(true)
    this.configService
      .setOption("notifications", "subscriptions", subscriptions)
      .subscribe(_ => this.updateComponent())
  }
}
