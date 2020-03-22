import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { Observable } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import moment from 'moment-timezone';

import { ConfigurationBaseComponent } from '../../configuration-base/configuration-base.component';
import { DateTimeAdapter } from 'ng-pick-datetime';
import { EventService, LoaderService, MonitoringService } from '../../services';

const scheduleMicrotask = Promise.resolve( null );


export interface TimeZoneGroup {
  groupName: string;
  zoneNames: string[];
}

export const _filter = (opt: string[], value: string): string[] => {
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
  clock: Object = null;
  
  timezoneGroups: TimeZoneGroup[] = [];
  timezoneGroupOptions: Observable<TimeZoneGroup[]>;
  
  timezoneUngroupped: string[] = [];
  timezoneUngrouppedOptions: Observable<string[]>;
  
  timezoneNames: string[];

  constructor(
    public loader: LoaderService,
    public eventService: EventService,
    public monitoringService: MonitoringService,

    private fb: FormBuilder,
    dateTimeAdapter: DateTimeAdapter<any>,
  ) {
    super(eventService, loader, monitoringService);
    dateTimeAdapter.setLocale('iso-8601');
    this.timezoneNames = moment.tz.names();

    this.timezoneNames.forEach(timezoneName => {
      const results = timezoneName.match(/(.*)\/(.*)/)
      if (results == null) {
        this.timezoneUngroupped.push(timezoneName);
      }
      else {
        let timezoneGroup = this.timezoneGroups.find(timezoneGroup => timezoneGroup.groupName === results[1]);
        if (timezoneGroup == null) {
          this.timezoneGroups.push({groupName: results[1], zoneNames: [results[2]]});
        }
        else {
          timezoneGroup.zoneNames.push(results[2]);
        }
      }
    });
  }

  ngOnInit() {
    super.initialize();
    
    this.updateComponent();
    this.updateForm();
    
    this.timezoneGroupOptions = this.clockForm.get('timezone')!.valueChanges
      .pipe(
        startWith(''),
        map(value => this._filterGroup(value))
      );

    this.timezoneUngrouppedOptions = this.clockForm.get('timezone')!.valueChanges
      .pipe(
        startWith(''),
        map(value => this._filterUngroupped(value))
      );
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
      .subscribe(clock => {
        this.clock = clock;
        if (clock != null) {
          this.clockForm.get('timezone').setValue(clock['timezone']);
        }

        this.loader.display(false);
      }
    );
  }

  onSynchronize() {
    this.monitoringService.synchronizeClock()
      .subscribe(_ => this.updateComponent()
    );
  }


  onSubmit() {
    const formModel = this.clockForm.value;
    let newDate = formModel.dateTime;
    this.monitoringService.changeClock(newDate.toISOString(), formModel.timezone)
      .subscribe(_ => this.updateComponent()
    );
  }

  private _filterGroup(value: string): TimeZoneGroup[] {
    if (value) {
      return this.timezoneGroups
        .map(group => ({groupName: group.groupName, zoneNames: _filter(group.zoneNames, value)}))
        .filter(group => group.zoneNames.length > 0);
    }

    return this.timezoneGroups;
  }

  private _filterUngroupped(value: string): string[] {
    if (value) {
      return _filter(this.timezoneUngroupped, value);
    }

    return this.timezoneUngroupped;
  }
}

