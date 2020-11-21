import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { Observable } from 'rxjs';
import { startWith, map, finalize } from 'rxjs/operators';

import * as moment from 'moment-timezone';

import { ConfigurationBaseComponent } from '../../configuration-base/configuration-base.component';
import { DateTimeAdapter } from '@danielmoncada/angular-datetime-picker';
import { EventService, LoaderService, MonitoringService } from '../../services';

const scheduleMicrotask = Promise.resolve( null );


export interface TimeZoneGroup {
  groupName: string;
  zoneNames: string[];
}

export interface Clock {
  network: string;
  system: string;
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
  clockForm: FormGroup;
  clock: any;

  timezoneGroups: TimeZoneGroup[] = [];
  timezoneGroupOptions: Observable<TimeZoneGroup[]>;

  timezoneUngroupped: string[] = [];
  timezoneUngrouppedOptions: Observable<string[]>;

  timezoneNames: string[];

  constructor(
    @Inject('EventService') public eventService: EventService,
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,

    private fb: FormBuilder,
    dateTimeAdapter: DateTimeAdapter<any>,
  ) {
    super(eventService, loader, monitoringService);
    dateTimeAdapter.setLocale(localStorage.getItem('localeId'));
    this.timezoneNames = moment.tz.names();

    this.timezoneNames.forEach(timezoneName => {
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

    this.updateComponent();
    this.updateForm();

    if (this.clockForm.get('timezone')) {
      this.timezoneGroupOptions = this.clockForm.get('timezone').valueChanges
        .pipe(
          startWith(''),
          map(value => this._filterGroup(value))
        );

      this.timezoneUngrouppedOptions = this.clockForm.get('timezone').valueChanges
        .pipe(
          startWith(''),
          map(value => this._filterUngroupped(value))
        );
    }
  }

  ngOnDestroy() {
    super.destroy();
  }

  updateForm() {
    this.clockForm = this.fb.group( {
      dateTime: '',
      timezone: ''
    });
  }

  updateComponent() {
    // avoid ExpressionChangedAfterItHasBeenCheckedError
    // https://github.com/angular/angular/issues/17572#issuecomment-323465737
    scheduleMicrotask.then(() => {
      this.loader.display( true );
    } );

    this.monitoringService.getClock()
      .pipe(finalize(() => this.loader.display(false)))
      .subscribe(clock => {
        this.clock = clock;
        if (clock != null) {
          this.clockForm.get('timezone').setValue(clock.timezone);
        }

        this.loader.display(false);
      }
    );
  }

  // onSynchronize() {
  //   this.monitoringService.synchronizeClock()
  //     .subscribe(_ => this.updateComponent()
  //   );
  // }


  onSubmit() {
    const formModel = this.clockForm.value;
    const newDate = formModel.dateTime;
    this.monitoringService.changeClock(newDate.toISOString(), formModel.timezone)
      .subscribe(_ => this.updateComponent()
    );
  }

  private _filterGroup(value: string): TimeZoneGroup[] {
    if (value) {
      return this.timezoneGroups
        .map(group => ({groupName: group.groupName, zoneNames: filter(group.zoneNames, value)}))
        .filter(group => group.zoneNames.length > 0);
    }

    return this.timezoneGroups;
  }

  private _filterUngroupped(value: string): string[] {
    if (value) {
      return filter(this.timezoneUngroupped, value);
    }

    return this.timezoneUngroupped;
  }
}

