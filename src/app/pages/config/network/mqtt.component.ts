
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule, UntypedFormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';

import { finalize } from 'rxjs/operators';

import { Clipboard } from '@angular/cdk/clipboard';
import { MatListModule } from '@angular/material/list';
import { ConfigurationBaseComponent } from '@app/configuration-base/configuration-base.component';
import { Option } from '@app/models';
import { ConfigurationService, EventService, LoaderService, MonitoringService } from '@app/services';
import { getValue } from '@app/utils';
import { environment } from '@environments/environment';
import { forkJoin, Subscription } from 'rxjs';

const scheduleMicrotask = Promise.resolve(null);

@Component({
  selector: 'app-mqtt',
  templateUrl: 'mqtt.component.html',
  styleUrls: ['mqtt.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDividerModule,
    MatListModule,
    MatIconModule
  ]
})
export class MqttComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  mqttForm: FormGroup;
  mqttConnection: Option = null;
  mqttInternalRead: Option = null;
  mqttExternalPublish: Option = null;
  private mqttFormSubscriptions: Subscription[] = [];

  constructor(
    @Inject('ConfigurationService') private configService: ConfigurationService,
    @Inject('EventService') public eventService: EventService,
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,

    private fb: UntypedFormBuilder,
    private clipboard: Clipboard,
    private snackBar: MatSnackBar
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
  }

  ngOnDestroy() {
    this.resetMqttFormSubscriptions();
    super.destroy();
  }

  updateComponent() {
    this.loader.display(true);

    forkJoin({
      mqttConnection: this.configService.getOption('mqtt', 'connection'),
      mqttInternalRead: this.configService.getOption('mqtt', 'internal_read'),
      mqttExternalPublish: this.configService.getOption('mqtt', 'external_publish')
    })
      .pipe(finalize(() => this.loader.display(false)))
      .subscribe(({ mqttConnection, mqttInternalRead, mqttExternalPublish }) => {
        this.mqttConnection = mqttConnection;
        this.mqttInternalRead = mqttInternalRead;
        this.mqttExternalPublish = mqttExternalPublish;

        this.updateMqttForm(this.mqttConnection, this.mqttExternalPublish);
      });
  }

  updateMqttForm(mqttConnection: Option, mqttExternalPublish: Option) {
    this.resetMqttFormSubscriptions();

    const mqttEnabled = getValue(mqttConnection?.value, 'enabled');
    const mqttExternal = getValue(mqttConnection?.value, 'external');

    this.mqttForm = this.fb.group({
      mqttEnabled: mqttEnabled,
      mqttExternal: [{ value: mqttExternal, disabled: !mqttEnabled }],
      mqttHostname: [getValue(mqttExternalPublish?.value, 'hostname'), Validators.required],
      mqttPort: [
        getValue(mqttExternalPublish?.value, 'port'),
        [Validators.required, Validators.min(1), Validators.max(65535)]
      ],
      mqttUsername: getValue(mqttExternalPublish?.value, 'username'),
      mqttPassword: getValue(mqttExternalPublish?.value, 'password'),
      mqttTlsEnabled: getValue(mqttExternalPublish?.value, 'tls_enabled', true),
      mqttTlsInsecure: getValue(mqttExternalPublish?.value, 'tls_insecure', false)
    });

    if (this.mqttForm.get('mqttEnabled').value && this.mqttForm.get('mqttExternal').value) {
      this.mqttForm.get('mqttHostname').setValidators([Validators.required]);
      this.mqttForm.get('mqttPort').setValidators([Validators.required, Validators.min(1), Validators.max(65535)]);
      this.mqttForm.get('mqttUsername').setValidators([Validators.required]);
      this.mqttForm.get('mqttPassword').setValidators([Validators.required]);
    } else {
      this.mqttForm.get('mqttHostname').clearValidators();
      this.mqttForm.get('mqttPort').clearValidators();
      this.mqttForm.get('mqttUsername').clearValidators();
      this.mqttForm.get('mqttPassword').clearValidators();
    }

    const mqttEnabledControl = this.mqttForm.get('mqttEnabled');
    const mqttExternalControl = this.mqttForm.get('mqttExternal');
    this.mqttFormSubscriptions.push(
      mqttEnabledControl.valueChanges.subscribe(enabled => {
        if (enabled) {
          mqttExternalControl.enable({ emitEvent: false });
        } else {
          mqttExternalControl.disable({ emitEvent: false });
        }
      })
    );
  }

  private resetMqttFormSubscriptions() {
    this.mqttFormSubscriptions.forEach(subscription => subscription.unsubscribe());
    this.mqttFormSubscriptions = [];
  }

  copyToClipboard(text: string) {
    this.clipboard.copy(text);

    this.snackBar.open($localize`:@@copied to clipboard:Copied to clipboard!`, null, {
      duration: environment.snackDuration
    });
  }

  getMqttUrl() {
    if (getValue(this.mqttConnection.value, 'enabled') && !getValue(this.mqttConnection.value, 'external')) {
      const protocol = getValue(this.mqttInternalRead.value, 'tls_enabled') ? 'mqtts' : 'mqtt';
      const hostname = getValue(this.mqttInternalRead.value, 'hostname');
      const port = getValue(this.mqttInternalRead.value, 'port');
      return `${protocol}://${hostname}:${port}`;
    }
  }

  getMqttUsername() {
    if (getValue(this.mqttConnection.value, 'enabled') && !getValue(this.mqttConnection.value, 'external')) {
      const username = getValue(this.mqttInternalRead.value, 'username');
      return username;
    }
  }

  getMqttPassword() {
    if (getValue(this.mqttConnection.value, 'enabled') && !getValue(this.mqttConnection.value, 'external')) {
      const password = getValue(this.mqttInternalRead.value, 'password');
      return password;
    }
  }

  prepareMqttConnection(): any {
    const mqttForm = this.mqttForm.value;
    const mqtt: any = {
      enabled: mqttForm.mqttEnabled || false,
      external: mqttForm.mqttExternal || false
    };

    return mqtt;
  }

  prepareMqttExternal(): any {
    const mqttForm = this.mqttForm.value;
    const mqtt: any = {
      hostname: mqttForm.mqttHostname,
      port: mqttForm.mqttPort,
      username: mqttForm.mqttUsername,
      password: mqttForm.mqttPassword,
      tls_enabled: mqttForm.mqttTlsEnabled || false,
      tls_insecure: mqttForm.mqttTlsInsecure || false
    };

    return mqtt;
  }

  onSaveMqtt() {
    this.loader.disable(true);

    const mqttExternal = this.prepareMqttExternal();
    const mqttConnection = this.prepareMqttConnection();

    forkJoin([
      this.configService.setOption('mqtt', 'external_publish', mqttExternal),
      this.configService.setOption('mqtt', 'connection', mqttConnection)
    ])
      .pipe(finalize(() => this.loader.disable(false)))
      .subscribe({
        next: () => this.updateComponent(),
        error: () =>
          this.snackBar.open($localize`:@@failed update:Failed to update!`, null, {
            duration: environment.snackDuration
          })
      });
  }
}
