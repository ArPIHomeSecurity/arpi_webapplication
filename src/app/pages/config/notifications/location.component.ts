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
      name: getValue(locationOption?.value, 'name', ''),
      latitude: getValue(locationOption?.value, 'latitude', 0.0),
      longitude: getValue(locationOption?.value, 'longitude', 0.0),
      country: getValue(locationOption?.value, 'country', ''),
      city: getValue(locationOption?.value, 'city', ''),
      state: getValue(locationOption?.value, 'state', ''),
      zip_code: getValue(locationOption?.value, 'zip_code', ''),
      address: getValue(locationOption?.value, 'address', ''),
      description: getValue(locationOption?.value, 'description', ''),
      contactName: getValue(locationOption?.value, 'contact_name', ''),
      contactPhone: getValue(locationOption?.value, 'contact_phone', ''),
      contactEmail: getValue(locationOption?.value, 'contact_email', '')
    });
  }

  prepareLocation(): any {
    const formModel = this.locationForm.value;
    return {
      name: formModel.name,
      latitude: formModel.latitude,
      longitude: formModel.longitude,
      country: formModel.country,
      city: formModel.city,
      state: formModel.state,
      zip_code: formModel.zip_code,
      address: formModel.address,
      description: formModel.description,
      contact_name: formModel.contactName,
      contact_phone: formModel.contactPhone,
      contact_email: formModel.contactEmail
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
