import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule, UntypedFormBuilder } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';

import { finalize } from 'rxjs/operators';

import { ConfigurationBaseComponent } from '@app/configuration-base/configuration-base.component';
import { Option } from '@app/models';
import { ConfigurationService, EventService, LoaderService, MonitoringService } from '@app/services';
import { getValue } from '@app/utils';
import { environment } from '@environments/environment';

const scheduleMicrotask = Promise.resolve(null);

@Component({
  selector: 'app-location',
  templateUrl: 'location.component.html',
  styleUrls: ['location.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, MatExpansionModule, MatFormFieldModule, MatInputModule, MatButtonModule]
})
export class LocationComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  locationForm: FormGroup;
  locationOption: Option | null = null;

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
  }

  ngOnDestroy() {
    super.destroy();
  }

  updateComponent() {
    this.loader.display(true);

    this.configService
      .getOption('system', 'location')
      .pipe(finalize(() => this.loader.display(false)))
      .subscribe({
        next: locationOption => {
          this.locationOption = locationOption;
          this.updateLocationForm(this.locationOption);
        },
        error: () => {
          this.locationOption = null;
          this.updateLocationForm(this.locationOption);
        }
      });
  }

  updateLocationForm(locationOption: Option | null) {
    this.locationForm = this.fb.group({
      locationName: getValue(locationOption?.value, 'location_name', ''),
      locationLatitude: getValue(locationOption?.value, 'location_latitude', 0.0),
      locationLongitude: getValue(locationOption?.value, 'location_longitude', 0.0),
      locationCountry: getValue(locationOption?.value, 'location_country', ''),
      locationCity: getValue(locationOption?.value, 'location_city', ''),
      locationState: getValue(locationOption?.value, 'location_state', ''),
      locationZipCode: getValue(locationOption?.value, 'location_zip_code', ''),
      locationAddress: getValue(locationOption?.value, 'location_address', ''),
      locationDescription: getValue(locationOption?.value, 'location_description', ''),
      locationContactName: getValue(locationOption?.value, 'location_contact_name', ''),
      locationContactPhone: getValue(locationOption?.value, 'location_contact_phone', ''),
      locationContactEmail: getValue(locationOption?.value, 'location_contact_email', '')
    });
  }

  prepareLocation(): any {
    const formModel = this.locationForm.value;
    return {
      location_name: formModel.locationName,
      location_latitude: formModel.locationLatitude,
      location_longitude: formModel.locationLongitude,
      location_country: formModel.locationCountry,
      location_city: formModel.locationCity,
      location_state: formModel.locationState,
      location_zip_code: formModel.locationZipCode,
      location_address: formModel.locationAddress,
      location_description: formModel.locationDescription,
      location_contact_name: formModel.locationContactName,
      location_contact_phone: formModel.locationContactPhone,
      location_contact_email: formModel.locationContactEmail
    };
  }

  onSaveLocation() {
    this.loader.disable(true);

    this.configService
      .setOption('system', 'location', this.prepareLocation())
      .pipe(finalize(() => this.loader.disable(false)))
      .subscribe({
        next: () => this.updateComponent(),
        error: () =>
          this.snackBar.open($localize`:@@failed update:Failed to update!`, undefined, {
            duration: environment.snackDuration
          })
      });
  }
}
