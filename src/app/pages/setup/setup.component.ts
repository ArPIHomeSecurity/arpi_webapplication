import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';

import { ConfigurationBaseComponent } from '@app/configuration-base/configuration-base.component';
import { ConfigurationService, EventService, LoaderService, MonitoringService } from '@app/services';

import { Installation } from '@app/models';
import { environment } from '@environments/environment';
import { configureBackend } from '@app/utils';
import { CdkDragDrop, CdkDragStart, moveItemInArray } from '@angular/cdk/drag-drop';


/**
 * Installation test result
 * 
 * - undefined: test not run
 * - null: test running
 * - true: test passed
 * - false: test failed
 */
export class InstallationTestResult {
  primary: boolean = null
  secondary: boolean = null
}

@Component({
  selector: 'setup',
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.scss'
})
export class SetupComponent extends ConfigurationBaseComponent implements OnInit {
  @ViewChild('installationsForm') installationsForm: NgForm;

  isMultiInstallation = environment.isMultiInstallation;
  installations: Installation[];
  selectedInstallationId: number;
  testRunningForId: number;
  testResults: Map<number, InstallationTestResult> = new Map();
  showApiLink = environment.showApiLink;

  isDragging = false;

  constructor(
    @Inject('EventService') public eventService: EventService,
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,
    @Inject('ConfigurationService') private configService: ConfigurationService
  ) {
    super(eventService, loader, monitoringService);

    this.installations = JSON.parse(localStorage.getItem('installations')) || [];
    this.selectedInstallationId = parseInt(localStorage.getItem('selectedInstallationId'));
  }

  ngOnInit(): void {
    if (this.installations.length === 0) {
      this.setupDefaultInstallation();
    }
  }

  setupDefaultInstallation(): void {
    this.installations = [{
      id: 0,
      installation_id: null,
      version: null,
      name: 'Default',
      scheme: 'https',
      primaryDomain: window.location.hostname,
      primaryPort: parseInt(window.location.port),
      secondaryDomain: '',
      secondaryPort: null,
      order: 0
    }];
    this.selectedInstallationId = 0;
  }

  getInstallationKey(index: number): number {
    if (this.installations) {
      return this.installations[index].id;
    }
  }

  isRegistered(installation_id: string): boolean {
    if (!installation_id) {
      return null;
    }

    const installation = this.installations.find(item => item.installation_id === installation_id);

    if (!installation) {
      return false;
    }

    return localStorage.getItem(`${installation.installation_id}:deviceToken`) != null;
  }

  isActive(index: number): boolean {
    if (index < 0 || index >= this.installations.length) {
      return false;
    }

    return this.installations[index].id === this.selectedInstallationId;
  }

  testInstallation(index: number): void {
    const installation = this.installations[index];

    const testResult = new InstallationTestResult();
    this.testRunningForId = installation.id;
    this.testResults.set(installation.id, testResult);

    if (installation.primaryDomain !== '') {
      if (!installation.primaryPort) {
        installation.primaryPort = 443;
      }
      const primaryURL = `${installation.scheme}://${installation.primaryDomain}:${installation.primaryPort}/api/version`;
      fetch(primaryURL)
        .then(response => {
          if (!response.ok) {
            testResult.primary = false;
          }
          return response.text();
        })
        .then((version) => {
          if (/^v\d+\.\d+\.\d+.*$/.test(version)) {
            testResult.primary = true;
            installation.version = version;
          } else {
            testResult.primary = false;
          }
        })
        .catch(() => {
          testResult.primary = false;
        });
    }
    else {
      testResult.primary = undefined;
    }

    if (installation.secondaryDomain !== '') {
      if (!installation.secondaryPort) {
        installation.secondaryPort = 443;
      }
      const secondaryURL = `${installation.scheme}://${installation.secondaryDomain}:${installation.secondaryPort}/api/version`;
      fetch(secondaryURL)
        .then(response => {
          if (!response.ok) {
            testResult.secondary = false;
          }
          return response.text();
        })
        .then((version) => {
          if (/^v\d+\.\d+\.\d+.*$/.test(version)) {
            testResult.secondary = true;
            installation.version = version;
          } else {
            testResult.secondary = false;
          }
        })
        .catch(() => {
          testResult.secondary = false;
        });
    }
    else {
      testResult.secondary = undefined;
    }

    const installationIdURL = `${installation.scheme}://${installation.primaryDomain}:${installation.primaryPort}/api/config/installation_id`;
    fetch(installationIdURL)
      .then(response => response.text())
      .then(installationId => {
        // check response format
        // installation id sha256
        if (typeof installationId !== 'string' || !/^[a-f0-9]{64}$/.test(installationId)) {
          console.error('Invalid installation id', installationId.substring(0, 100));
          return;
        }
        installation.installation_id = installationId;
        this.onSave();
      })
      .catch(error => {
        console.error('Error loading installation id', {
          message: error.message,
          stack: error.stack,
          installationIdURL: installationIdURL
        });
      });
  }

  getTestResult(index: number): InstallationTestResult {
    const testResult = this.testResults.get(this.installations[index].id);
    return testResult || null;
  }

  addInstallation(): void {
    const installation = new Installation();
    installation.id = this.installations.map(i => i.id)
      .reduce((max, current) => Math.max(max, current), 0) + 1;
    this.installations.push(installation);
  }

  deleteInstallation(index: number): void {
    this.installations.splice(index, 1);
  }

  isInstallationActive(index: number): boolean {
    return this.selectedInstallationId === this.installations[index].id;
  }

  onSave() {
    const installations = JSON.stringify(this.installations);
    localStorage.setItem('installations', installations);
    window.dispatchEvent(new StorageEvent('storage', { key: 'installations', newValue: installations }));

    if (this.installations.length === 1) {
      this.selectedInstallationId = this.installations[0].id;
      localStorage.setItem('selectedInstallationId', this.selectedInstallationId.toString());
      window.dispatchEvent(new StorageEvent('storage', { key: 'selectedInstallationId', newValue: this.selectedInstallationId.toString() }));
    }

    configureBackend().then(() => {
      console.log('Backend configured');
      this.eventService.connect();
    });

    this.installationsForm.form.markAsPristine();
  }

  onDragStarted(event:  CdkDragStart<string[]>) {
    this.isDragging = true;
  }

  onDrop(event: CdkDragDrop<string[]>) {
    this.isDragging = false;
    
    // hack dnd
    const installations = this.installations.slice();
    this.installations = [];
    moveItemInArray(installations, event.previousIndex, event.currentIndex);
    installations.forEach((installation, index) => {
      installation.order = index;
    });
    setTimeout(() => {
      this.installations = installations
      this.onSave();
    }, 0);
  }
}
