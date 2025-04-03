import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@app/models';
import { environment } from '@environments/environment';
import { LocationTestResult, testLocation } from './location';
import { AUTHENTICATION_SERVICE } from '@app/tokens';
import { AuthenticationService } from '@app/services';
import { MatDialog } from '@angular/material/dialog';
import { QuestionDialogComponent } from '@app/components/question-dialog/question-dialog.component';


@Component({
  selector: 'app-location-details',
  templateUrl: './location-details.component.html',
  styleUrls: ['./location-details.component.scss']
})
export class LocationDetailsComponent {

  ALREADY_EXISTS = $localize`:@@location already exists:Location already exists!`

  location: Location;
  version: string;
  locationForm: FormGroup;
  newLocation: boolean;
  firstLocation: boolean;

  selectedLocationId: string;
  testResult: LocationTestResult = null;
  showApiLink = environment.showApiLink;
  isMultiLocation = environment.isMultiLocation;

  constructor(
    @Inject(AUTHENTICATION_SERVICE) public authenticationService: AuthenticationService,

    private route: ActivatedRoute,
    private router: Router,
    public dialog: MatDialog,
  ) {
    this.route.params.subscribe(params => {
      const locations = JSON.parse(localStorage.getItem('locations')) || [];
      this.firstLocation = locations.length === 0;
      if (params.id) {
        this.location = locations.find(location => location.id === params.id);
        this.newLocation = false;
      }
      else {
        this.location = new Location();
        this.newLocation = true;
      }

      if (this.firstLocation && !this.isMultiLocation) {
        this.locationDefaultLocation();
      }

      this.updateForm(this.location);
    });

    this.selectedLocationId = localStorage.getItem('selectedLocationId');
  }

  locationDefaultLocation(): void {
    this.location = {
      id: null,
      name: 'Default',
      scheme: 'https',
      primaryDomain: window.location.hostname,
      primaryPort: parseInt(window.location.port),
      secondaryDomain: '',
      secondaryPort: null,
      order: 0
    };
  }

  updateForm(location: Location) {
    this.locationForm = new FormGroup({
      id: new FormControl(location.id),
      name: new FormControl(location.name, Validators.required),
      scheme: new FormControl(location.scheme),
      primaryDomain: new FormControl(location.primaryDomain),
      primaryPort: new FormControl(location.primaryPort),
      secondaryDomain: new FormControl(location.secondaryDomain),
      secondaryPort: new FormControl(location.secondaryPort)
    });
  }

  executeLocationTest() {
    this.location = this.prepareLocation();
    this.testResult = new LocationTestResult();
    testLocation(this.location).subscribe(result => {
      this.testResult = result
      if (result.primaryLocationId && result.secondaryLocationId && result.primaryLocationId !== result.secondaryLocationId) {
        console.error('Primary and secondary location IDs do not match!', result);
      }
      else if (result.primaryLocationId) {
        this.location.id = result.primaryLocationId;
        this.version = result.primaryVersion;
      }
      else if (result.secondaryLocationId) {
        this.location.id = result.secondaryLocationId;
        this.version = result.secondaryVersion;
      }
    });
  }

  isRegistered() {
    if (!this.locationForm.value.id) {
      return false;
    }

    return this.authenticationService.getDeviceToken(this.locationForm.value.id) !== null;
  }

  onFieldChange($event) {
    // add default port if domain is empty
    if ($event.target.name === 'primaryDomain' &&
      this.location.primaryDomain === '' &&
      this.locationForm.value.primaryPort === null
    ) {
      this.locationForm.controls.primaryPort.setValue(443);
    }
    if ($event.target.name === 'secondaryDomain' &&
      this.location.secondaryDomain === '' &&
      this.locationForm.value.secondaryPort === null
    ) {
      this.locationForm.controls.secondaryPort.setValue(443);
    }

    // clear test result if any field changes
    this.testResult = null;
  }

  onCancel() {
    if (environment.isMultiLocation) {
      this.router.navigate(['/locations']);
    }
    else {
      this.router.navigate(['/setup']);
    }
  }

  prepareLocation(): Location {
    const formModel = this.locationForm.value;
    const location = new Location();
    location.id = formModel.id || this.location.id;
    location.name = formModel.name;
    location.scheme = formModel.scheme;
    location.primaryDomain = formModel.primaryDomain;
    location.primaryPort = formModel.primaryPort;
    location.secondaryDomain = formModel.secondaryDomain;
    location.secondaryPort = formModel.secondaryPort;
    return location;
  }

  alreadyExists() {
    var locations = JSON.parse(localStorage.getItem('locations')) || [];
    return locations.some(l => l.id === this.location.id);
  }

  cantSave() {
    // do not save if location Id is not set
    if (!this.location.id) {
      return true;
    }

    // do not save if new location already exists
    if (this.alreadyExists() && this.newLocation) {
      return true;
    }

    // do not save if location form is invalid or pristine
    if (this.locationForm.invalid || this.locationForm.pristine) {
      return true;
    }

    // do not save if primary or secondary is dirty and not tested
    if (this.locationForm.controls.primaryDomain.dirty || this.locationForm.controls.secondaryDomain.dirty) {
      if (this.testResult === null) {
        return true;
      }

      if (this.testResult.primary === null || this.testResult.secondary === null) {
        return true
      }
    }

    return false;
  }

  onSubmit() {
    const location = this.prepareLocation();
    var locations = JSON.parse(localStorage.getItem('locations') || "[]");
    const index = locations.findIndex(l => l.id === location.id);
    if (index >= 0) {
      locations[index] = location;
    }
    else {
      locations.push(location);
    }

    localStorage.setItem('locations', JSON.stringify(locations));
    window.dispatchEvent(new StorageEvent('storage', { key: 'locations', newValue: JSON.stringify(locations) }));
    if (this.isMultiLocation) {
      this.router.navigate(['/locations']);
    }
    else {
      this.router.navigate(['/setup']);
    }
  }

  openDeleteDialog() {
    var locations = JSON.parse(localStorage.getItem('locations')) || [];
    const dialogRef = this.dialog.open(QuestionDialogComponent, {
      width: '450px',
      data: {
        title: $localize`:@@delete location:Delete Location`,
        message: $localize`:@@delete location message:Are you sure you want to delete the location "${this.location.name}"?`,
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
        locations = locations.filter(x => x.id !== this.location.id);
        localStorage.setItem('locations', JSON.stringify(locations));
        this.router.navigate(['/locations']);
      }
    });
  }
}
