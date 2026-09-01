import { Component, Inject, OnDestroy, OnInit } from "@angular/core"
import { FormGroup, ReactiveFormsModule, UntypedFormBuilder } from "@angular/forms"
import { MatButtonModule } from "@angular/material/button"
import { MatCheckboxModule } from "@angular/material/checkbox"
import { MatExpansionModule } from "@angular/material/expansion"
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatInputModule } from "@angular/material/input"
import { MatSnackBar } from "@angular/material/snack-bar"

import { forkJoin } from "rxjs"
import { finalize } from "rxjs/operators"

import { ConfigurationBaseComponent } from "@app/configuration-base/configuration-base.component"
import { Option } from "@app/models"
import { ConfigurationService, EventService, LoaderService, MonitoringService } from "@app/services"
import { getValue } from "@app/utils"
import { environment } from "@environments/environment"

const scheduleMicrotask = Promise.resolve(null)

@Component({
  selector: "app-sms-action",
  templateUrl: "sms-action.component.html",
  styleUrls: ["sms-action.component.scss"],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ]
})
export class SmsActionComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  smsActionForm: FormGroup
  smsActionOption: Option | null = null

  constructor(
    @Inject("ConfigurationService") private configService: ConfigurationService,
    @Inject("EventService") public eventService: EventService,
    @Inject("LoaderService") public loader: LoaderService,
    @Inject("MonitoringService") public monitoringService: MonitoringService,

    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar
  ) {
    super(eventService, loader, monitoringService)
  }

  ngOnInit() {
    super.initialize()

    scheduleMicrotask.then(() => {
      this.loader.display(true)
    })
    this.updateComponent()
  }

  ngOnDestroy() {
    super.destroy()
  }

  updateComponent() {
    this.loader.display(true)

    forkJoin({
      smsAction: this.configService.getOption("notifications", "sms_action"),
      smsCommand: this.configService.getOption("notifications", "sms_command")
    })
      .pipe(finalize(() => this.loader.display(false)))
      .subscribe({
        next: options => {
          this.smsActionOption = options.smsAction
          this.updateForm(options.smsAction, options.smsCommand)
        },
        error: () => {
          this.smsActionOption = null
          this.updateForm(null, null)
        }
      })
  }

  updateForm(smsAction: Option | null, smsCommand: Option | null) {
    this.smsActionForm = this.fb.group({
      smsActionEnabled: getValue(smsAction?.value, "enabled", false),
      checkPhoneNumber: getValue(smsAction?.value, "check_phone_number", true),
      accessCodeRequired: getValue(smsAction?.value, "access_code_required", false),
      caseSensitive: getValue(smsCommand?.value, "case_sensitive", false),
      armAwayCommand: getValue(smsCommand?.value, "arm_away_command", "away"),
      armStayCommand: getValue(smsCommand?.value, "arm_stay_command", "stay"),
      disarmCommand: getValue(smsCommand?.value, "disarm_command", "disarm")
    })
  }

  prepareSmsAction(): any {
    const formModel = this.smsActionForm.value
    return {
      enabled: formModel.smsActionEnabled || false,
      check_phone_number: formModel.checkPhoneNumber || false,
      access_code_required: formModel.accessCodeRequired || false
    }
  }

  prepareSmsCommand(): any {
    const formModel = this.smsActionForm.value
    return {
      case_sensitive: formModel.caseSensitive || false,
      arm_away_command: formModel.armAwayCommand,
      arm_stay_command: formModel.armStayCommand,
      disarm_command: formModel.disarmCommand
    }
  }

  onSaveSmsAction() {
    this.loader.disable(true)
    forkJoin([
      this.configService.setOption("notifications", "sms_action", this.prepareSmsAction()),
      this.configService.setOption("notifications", "sms_command", this.prepareSmsCommand())
    ])
      .pipe(finalize(() => this.loader.disable(false)))
      .subscribe({
        next: () => this.updateComponent(),
        error: () =>
          this.snackBar.open($localize`:@@failed update:Failed to update!`, undefined, {
            duration: environment.snackDuration
          })
      })
  }
}
