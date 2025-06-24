import { Component, Inject } from '@angular/core';

import { ConfigurationBaseComponent } from '@app/configuration-base/configuration-base.component';
import { AuthenticationService, ConfigurationService, EventService, LoaderService, MonitoringService } from '@app/services';

import { Location } from '@app/models';
import { environment } from '@environments/environment';
import { configureBackend } from '@app/utils';
import { CdkDragDrop, CdkDragStart, moveItemInArray } from '@angular/cdk/drag-drop';
import { AUTHENTICATION_SERVICE } from '@app/tokens';
import { QuestionDialogComponent } from '@app/components/question-dialog/question-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { LocationTestResult, testLocation } from './location';


@Component({
    selector: 'location-list',
    templateUrl: './location-list.component.html',
    styleUrls: ['./location-list.component.scss'],
    standalone: false
})
export class LocationListComponent extends ConfigurationBaseComponent {
  isMultiLocation = environment.isMultiLocation;
  locations: Location[];
  selectedLocationId: string;
  testResults: Map<string, LocationTestResult> = new Map();
  showApiLink = environment.showApiLink;

  isDragging = false;

  constructor(
    @Inject(AUTHENTICATION_SERVICE) public authenticationService: AuthenticationService,
    @Inject('EventService') public eventService: EventService,
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,
    @Inject('ConfigurationService') private configService: ConfigurationService,

    public dialog: MatDialog,
  ) {
    super(eventService, loader, monitoringService);

    this.locations = JSON.parse(localStorage.getItem('locations')) || [];
    this.selectedLocationId = localStorage.getItem('selectedLocationId');
  }

  getLocationKey(index: number): string {
    if (this.locations) {
      return this.locations[index].id;
    }
  }

  isRegistered(locationId: string): boolean {
    if (!locationId) {
      return null;
    }

    return this.authenticationService.getDeviceToken(locationId) != null;
  }

  isActive(index: number): boolean {
    if (index < 0 || index >= this.locations.length) {
      return false;
    }

    return this.locations[index].id === this.selectedLocationId;
  }

  executeLocationTest(location: Location): void {
    this.testResults.set(location.id, new LocationTestResult());
    testLocation(location).subscribe(result => this.testResults.set(location.id, result));
  }

  getTestResult(locationId: string): LocationTestResult {
    return this.testResults.get(locationId) || null;
  }

  isLocationActive(index: number): boolean {
    return this.selectedLocationId === this.locations[index].id;
  }

  onTextChanged($event: Event) {
    // trimming the input value
    const target = $event.target as HTMLInputElement;
    target.value = target.value.trim();
  }

  onLogin(locationId: string) {
    localStorage.setItem('selectedLocationId', locationId);
    window.dispatchEvent(new StorageEvent('storage', { key: 'selectedLocationId', newValue: locationId }));
    window.location.href = '/login';
  }

  onSave() {
    const locations = JSON.stringify(this.locations);
    localStorage.setItem('locations', locations);
    window.dispatchEvent(new StorageEvent('storage', { key: 'locations', newValue: locations }));

    if (this.locations.length === 1) {
      this.selectedLocationId = this.locations[0].id;
      localStorage.setItem('selectedLocationId', this.selectedLocationId.toString());
      window.dispatchEvent(new StorageEvent('storage', { key: 'selectedLocationId', newValue: this.selectedLocationId.toString() }));
    }

    configureBackend().then(() => {
      console.log('Backend configured');
      this.eventService.connect();
    });
  }

  onDragStarted(event: CdkDragStart<string[]>) {
    this.isDragging = true;
  }

  onDrop(event: CdkDragDrop<string[]>) {
    this.isDragging = false;

    // hack dnd
    const locations = this.locations.slice();
    this.locations = [];
    moveItemInArray(locations, event.previousIndex, event.currentIndex);
    locations.forEach((location, index) => {
      location.order = index;
    });
    setTimeout(() => {
      this.locations = locations
      this.onSave();
    }, 0);
  }

  openDeleteDialog(locationId: string) {
    const location = this.locations.find(x => x.id === locationId);
    const dialogRef = this.dialog.open(QuestionDialogComponent, {
      width: '450px',
      data: {
        title: $localize`:@@delete location:Delete Location`,
        message: $localize`:@@delete location message:Are you sure you want to delete the location "${location.name}"?`,
        options: [
          {
            id: 'ok',
            text: $localize`:@@delete:Delete`,
            color: 'warn',
          },
          {
            id: 'cancel',
            text: $localize`:@@cancel:Cancel`
          }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'ok') {
        this.locations = this.locations.filter(x => x.id !== locationId);
        this.onSave();
      }
    });
  }
}
