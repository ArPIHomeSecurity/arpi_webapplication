import { Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ConfigurationBaseComponent } from '@app/configuration-base/configuration-base.component';
import { ConfigurationService, EventService, LoaderService, MonitoringService } from '@app/services';

import { Installation } from '@app/models';
import { environment } from '@environments/environment';


@Component({
  selector: 'setup',
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.scss'
})
export class SetupComponent extends ConfigurationBaseComponent implements OnInit {
  setupForm: FormGroup;

  isMultiInstallation = environment.isMultiInstallation;
  installations: Installation[];
  selectedInstallationId: string;

  constructor(
    @Inject('EventService') public eventService: EventService,
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,
    @Inject('ConfigurationService') private configService: ConfigurationService,
    private fb: FormBuilder
  ) {
    super(eventService, loader, monitoringService);

    this.installations = JSON.parse(localStorage.getItem('installations'));
    this.selectedInstallationId = localStorage.getItem('selectedInstallationId');
  }

  ngOnInit(): void {
    this.setupForm = this.fb.group({
      installations: this.fb.array([])
    });

    if (!this.installations) {
      if (environment.isMultiInstallation) {
        this.installations = [{
          id: 'default',
          name: '',
          scheme: 'https',
          primaryDomain: '',
          primaryPort: 443,
          secondaryDomain: '',
          secondaryPort: 443
        }];
        this.selectedInstallationId = 'default';
      }
      else {
        // try to load the default installation from the backend
        // TODO: decide to use localhost or arpi.local
        // localStorage.setItem('backend.domain', 'localhost');

        this.loader.display(true);
        this.configService.getInstallation()
          .subscribe({
            next: (installation) => {
              installation.id = 'default';
              installation.name = '';
              this.installations = [installation];
              this.selectedInstallationId = 'default';
              this.updateForm(this.installations);
              this.loader.display(false);
            },
            error: (error) => {
              const installation = new Installation();
              installation.id = 'default';
              installation.name = '';
              installation.primaryDomain = 'localhost';
              installation.primaryPort = 443;
              installation.secondaryDomain = '';
              installation.secondaryPort = null;
              this.installations = [installation];
              this.selectedInstallationId = 'default';

              this.updateForm(this.installations);
              this.loader.display(false);

              this.loader.display(false);
              console.error('Error loading installation', error);
            }
          });
      }
    }

    this.updateForm(this.installations);
  }

  newInstallationForm(installation: Installation): FormGroup {
    return this.fb.group({
      id: [installation.id],
      name: [installation.name],
      scheme: [installation.scheme],
      primaryDomain: [installation.primaryDomain, Validators.required],
      primaryPort: [installation.primaryPort],
      secondaryDomain: [installation.secondaryDomain],
      secondaryPort: [installation.secondaryPort]
    });
  }


  updateForm(installations: Installation[]): void {
    this.installationForms.clear();
    installations.forEach((installation) => {
      this.installationForms.push(this.newInstallationForm(installation));
    });
  }

  get installationForms(): FormArray {
    return this.setupForm.controls['installations'] as FormArray;
  }

  addInstallation(): void {
    const installation = new Installation();
    if (this.installations.find(item => item.id === 'default') === undefined) {
      installation.id = 'default';
      installation.scheme = 'https';
      installation.primaryDomain = '';
      installation.primaryPort = 443;
      installation.secondaryDomain = '';
      installation.secondaryPort = 443;
      
      this.installations.unshift(installation);
      this.installationForms.insert(0, this.newInstallationForm(installation));
      return;
    }
    
    installation.id = 'setup_' + this.installations.length;
    installation.scheme = 'https';
    installation.primaryPort = 443;
    this.installations.push(installation);
    this.installationForms.push(this.newInstallationForm(installation));
  }

  deleteInstallation(index: number): void {
    this.installations.splice(index, 1);
    this.updateForm(this.installations);
  }

  activateInstallation(index: number): void {
    const installationForm = this.installationForms.controls[index];
    this.selectedInstallationId = installationForm.get('id').value;
    localStorage.setItem('selectedInstallationId', this.selectedInstallationId.toString());
  }

  isInstallationActive(index: number): boolean {
    const installationForm = this.installationForms.controls[index];
    if (!installationForm) {
      return false;
    }

    return this.selectedInstallationId === installationForm.get('id').value;
  }

  onChangeScheme(event: any, index: number): void {
    const installationForm = this.installationForms.controls[index];
    installationForm.get('scheme').setValue(event.value);
  }

  async onSave(): Promise<void> {
    await Promise.all(this.installationForms.controls.map(async (installationForm) => {
        const tmpId = installationForm.get('id').value;
        const installation = new Installation()
        installation.name = installationForm.get('name').value;
        installation.scheme = installationForm.get('scheme').value;
        installation.primaryDomain = installationForm.get('primaryDomain').value;
        installation.primaryPort = installationForm.get('primaryPort').value;
        installation.secondaryDomain = installationForm.get('secondaryDomain').value;
        installation.secondaryPort = installationForm.get('secondaryPort').value;
        installation.id = installationForm.get('id').value;

        const index = this.installations.findIndex(item => item.id === tmpId);
        if (index !== -1) {
          this.installations[index] = installation;
        }
      })
    );

    const installations = JSON.stringify(this.installations);

    localStorage.setItem('installations', installations);
    localStorage.setItem('selectedInstallationId', this.selectedInstallationId.toString());
    this.setupForm.markAsPristine();

    if (!environment.isMultiInstallation) {
      // reload the page to get the correct base domain
      window.location.reload();
    }
  }
}
