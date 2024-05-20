import { Component, OnInit, OnDestroy, Inject, TemplateRef, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { DateTimeAdapter } from '@danielmoncada/angular-datetime-picker';
import { Observable } from 'rxjs';
import { startWith, map, finalize } from 'rxjs/operators';

import { TIME_ZONES } from './timezones';
import { ConfigurationBaseComponent } from '@app/configuration-base/configuration-base.component';
import { EventService, LoaderService, MonitoringService } from '@app/services';
import { environment } from '@environments/environment';
import * as moment from 'moment';

const scheduleMicrotask = Promise.resolve( null );


export interface TimeZoneGroup {
  groupName: string;
  zoneNames: string[];
}

export const filter = (opt: string[], value: string): string[] => {
  const filterValue = value.toLowerCase();

  return opt.filter(item => item.toLowerCase().indexOf(filterValue) === 0);
};

@Component( {
  templateUrl: 'clock.component.html',
  styleUrls: ['clock.component.scss'],
  providers: []
} )

export class ClockComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  @ViewChild('snackbarTemplate') snackbarTemplate: TemplateRef<any>;
  clockForm: UntypedFormGroup;
  clock: any;

  timezoneGroups: TimeZoneGroup[] = [];
  timezoneGroupOptions: Observable<TimeZoneGroup[]>;

  timezoneUngroupped: string[] = [];
  timezoneUngrouppedOptions: Observable<string[]>;

  constructor(
    @Inject('EventService') public eventService: EventService,
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,

    private fb: UntypedFormBuilder,
    private snackBar: MatSnackBar,
    dateTimeAdapter: DateTimeAdapter<any>
  ) {
    super(eventService, loader, monitoringService);
    dateTimeAdapter.setLocale(localStorage.getItem('localeId'));

    TIME_ZONES.forEach(timezoneName => {
      const results = timezoneName.match(/(.*)\/(.*)/);
      if (results == null) {
        this.timezoneUngroupped.push(timezoneName);
      } else {
        const timezoneGroup = this.timezoneGroups.find(tzGroup => tzGroup.groupName === results[1]);
        if (timezoneGroup == null) {
          this.timezoneGroups.push({groupName: results[1], zoneNames: [results[2]]});
        } else {
          timezoneGroup.zoneNames.push(results[2]);
        }
      }
    });
  }

  ngOnInit() {
    super.initialize();

    // avoid ExpressionChangedAfterItHasBeenCheckedError
    // https://github.com/angular/angular/issues/17572#issuecomment-323465737
    scheduleMicrotask.then(() => {
      this.loader.display(true);
    });
    this.updateComponent();
    
    this.updateForm();

    if (this.clockForm.get('timezone')) {
      this.timezoneGroupOptions = this.clockForm.get('timezone').valueChanges
        .pipe(
          startWith(''),
          map(value => this.filterGroup(value))
        );

      this.timezoneUngrouppedOptions = this.clockForm.get('timezone').valueChanges
        .pipe(
          startWith(''),
          map(value => this.filterUngroupped(value))
        );
    }
  }

  ngOnDestroy() {
    super.destroy();
  }

  updateForm() {
    this.clockForm = this.fb.group( {
      dateTime: new UntypedFormControl('', Validators.required),
      timezone: new UntypedFormControl('', Validators.required)
    });
  }

  updateComponent() {
    this.monitoringService.getClock()
      .pipe(finalize(() => this.loader.display(false)))
      .subscribe(clock => {
        this.clock = clock;
        if (clock != null) {
          this.clockForm.get('timezone').setValue(clock.timezone);
        }

        this.loader.display(false);
        this.loader.disable(false);
      }
    );
  }

  // onSynchronize() {
  //   this.monitoringService.synchronizeClock()
  //     .subscribe(_ => this.updateComponent()
  //   );
  // }


  onSubmit() {
    this.loader.disable(true);
    const formModel = this.clockForm.value;
    const newDate = formModel.dateTime;
    this.monitoringService.changeClock(newDate.toISOString(), formModel.timezone)
      .subscribe(
        _ => this.updateComponent(),
        _ => {
          this.loader.disable(false);
          this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration});
        }
    );
  }

  getDuration(uptime) {
    return moment.duration(-uptime, 'seconds').humanize(true);
  }

  private filterGroup(value: string): TimeZoneGroup[] {
    if (value) {
      return this.timezoneGroups
        .map(group => ({groupName: group.groupName, zoneNames: filter(group.zoneNames, value)}))
        .filter(group => group.zoneNames.length > 0);
    }

    return this.timezoneGroups;
  }

  private filterUngroupped(value: string): string[] {
    if (value) {
      return filter(this.timezoneUngroupped, value);
    }

    return this.timezoneUngroupped;
  }
}

