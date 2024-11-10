import { Component, Input, OnInit, OnDestroy, Inject, TemplateRef, ViewChild } from '@angular/core';
import { FormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ConfigurationBaseComponent } from '@app/configuration-base/configuration-base.component';
import { Option, DEFAULT_NOTIFICATION_DYNDNS, DEFAULT_NOTIFICATION_ACCESS, DEFAULT_PASSWORD_VALUE } from '@app/models';
import { ConfigurationService, EventService, LoaderService, MonitoringService } from '@app/services';
import { getValue } from '@app/utils';
import { environment } from '@environments/environment';


const scheduleMicrotask = Promise.resolve(null);


@Component({
  templateUrl: 'network.component.html',
  styleUrls: ['network.component.scss'],
})
export class NetworkComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  @ViewChild('snackbarTemplate') snackbarTemplate: TemplateRef<any>;
  @Input() onlyAlerting = false;
  dyndnsForm: FormGroup;
  accessForm: FormGroup;
  dyndns: Option = null;
  access: Option = null;

  publicAccess: boolean = false;
  publicUrl: string = "";
  publicUrlAccessible: boolean = null;

  // values from the noipy python module
  providers = [
      {value: '', label: '--'},
      {value: 'noip', label: 'www.noip.com'},
      {value: 'dyn', label: 'www.dyndns.org'},
      {value: 'duck', label: 'www.duckdns.org'},
  ];

  constructor(
    @Inject('ConfigurationService') private configService: ConfigurationService,
    @Inject('EventService') public eventService: EventService,
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,

    private fb: UntypedFormBuilder,
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

    this.eventService.listen('public_access_change')
      .subscribe((publicAccess) => {
        this.publicAccess = publicAccess;
        this.testPublicUrl();
      }
    );
  }

  ngOnDestroy() {
    super.destroy();
  }

  getPublicUrl() {
    const hostname = getValue(this.dyndns.value, 'hostname');
    if (this.publicAccess && hostname) {
      // current hostname equals to the public hostname
      if (window.location.hostname != hostname) {
        return "https://" + hostname;
      }
    }
    return null;
  }

  testPublicUrl() {
    // test if public hostname is reachable
    const publicUrl = this.getPublicUrl() + "/api/version";
    if (publicUrl) {
      // test https access from the browser with ajax
      const xhr = new XMLHttpRequest();
      xhr.onload = () => {
        if (xhr.readyState == 4) {
          if (xhr.status == 200) {
            this.publicUrlAccessible = true;
          } else {
            this.publicUrlAccessible = false;
          }
        }
      }
      xhr.onerror = () => {
        this.publicUrlAccessible = false;
      }
      xhr.open('GET', publicUrl, true);
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
      setTimeout(() => xhr.send(), 1000);
    }
  }

  updateComponent() {
    forkJoin({
      dyndns: this.configService.getOption('network', 'dyndns'),
      access: this.configService.getOption('network', 'access'),
      publicAccess: this.configService.getPublicAccess()
    })
    .pipe(finalize(() => this.loader.display(false)))
    .subscribe(results => {
      this.dyndns = getValue(results, 'dyndns', DEFAULT_NOTIFICATION_DYNDNS);
      this.access = getValue(results, 'access', DEFAULT_NOTIFICATION_ACCESS);
      this.publicAccess = results.publicAccess;

      this.updateDyndnsForm(this.dyndns);
      this.testPublicUrl();
      this.updateTerminalForm(this.access);
      this.loader.display(false);
    });
  }

  updateDyndnsForm(dyndns: Option) {
    this.dyndnsForm = this.fb.group({
      dyndnsUsername: [getValue(dyndns.value, 'username'), Validators.required],
      dyndnsPassword: [getValue(dyndns.value, 'password'), Validators.required],
      dyndnsHostname: [getValue(dyndns.value, 'hostname'), Validators.required],
      dyndnsProvider: [getValue(dyndns.value, 'provider'), Validators.required],
      dyndnsRestrictHost: getValue(dyndns.value, 'restrict_host'),
      certbotEmail: [getValue(dyndns.value, 'certbot_email'), Validators.required]
    });
  }

  updateTerminalForm(access: Option) {
    this.accessForm = this.fb.group({
      accessSshService: getValue(access.value, 'service_enabled'),
      accessSshRestrictLocalNetwork: getValue(access.value, 'restrict_local_network'),
      accessSshPasswordAuthentication: getValue(access.value, 'password_authentication_enabled')
    });
  }

  updateDyndns() {
    forkJoin({
      dyndns: this.configService.getOption('network', 'dyndns'),
      publicAccess: this.configService.getPublicAccess()
    })
    .pipe(finalize(() => this.loader.display(false)))
    .subscribe(results => {
        this.dyndns = getValue(results, 'dyndns', DEFAULT_NOTIFICATION_DYNDNS);
        this.publicAccess = results.publicAccess;

        this.updateDyndnsForm(this.dyndns);
        this.testPublicUrl();
        this.loader.display(false);
        this.loader.disable(false);
      }
    );
  }

  updateAccess() {
    this.configService.getOption('network', 'access')
      .subscribe(access => {
        this.access = getValue(access, 'access', DEFAULT_NOTIFICATION_ACCESS);
        this.updateTerminalForm(this.access);
        this.loader.display(false);
        this.loader.disable(false);
      }
    );
  }

  prepareDyndns(): any {
    const formModel = this.dyndnsForm.value;
    const dyndns: any = {
      username: formModel.dyndnsUsername,
      hostname: formModel.dyndnsHostname,
      provider: formModel.dyndnsProvider,
      restrict_host: formModel.dyndnsRestrictHost,
      certbot_email: formModel.certbotEmail
    };

    if (formModel.dyndnsPassword != DEFAULT_PASSWORD_VALUE) {
      dyndns.password = formModel.dyndnsPassword;
    }

    return dyndns;
  }

  prepareAccess(): any {
    const formModel = this.dyndnsForm.value;
    return {
      service_enabled: formModel.accessSshService,
      restrict_local_network: formModel.accessSshRestrictLocalNetwork,
      password_authentication_enabled: formModel.accessSshPasswordAuthentication
    };
  }

  onPasswordFocus() {
    const passwordControl = this.dyndnsForm.get('dyndnsPassword');

    if (passwordControl.value == DEFAULT_PASSWORD_VALUE) {
      passwordControl.markAsTouched();
      passwordControl.setValue("");
    }
  }
  
  onPasswordBlur() {
    const passwordControl = this.dyndnsForm.get('dyndnsPassword');
  
    // Check if the user has changed the password field's value.
    if (!passwordControl.dirty) {
      // If the user didn't change it, restore the initial value.
      passwordControl.setValue(DEFAULT_PASSWORD_VALUE);
    }
  }

  onSaveDyndns() {
    this.loader.disable(true);
    this.configService.setOption('network', 'dyndns', this.prepareDyndns())
      .subscribe({
        next: () => this.updateDyndns(),
        error: () => this.snackBar.openFromTemplate(this.snackbarTemplate, { duration: environment.snackDuration })
      });
  }

  onSaveAccess() {
    this.loader.disable(true);
    this.configService.setOption('network', 'access', this.prepareAccess())
      .subscribe({
        next: () => this.updateAccess(),
        error: () => this.snackBar.openFromTemplate(this.snackbarTemplate, { duration: environment.snackDuration })
      });
  }
}

