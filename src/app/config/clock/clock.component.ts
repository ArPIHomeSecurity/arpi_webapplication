import { Component, Input, OnInit } from '@angular/core';
import { Observable ,  forkJoin } from 'rxjs';

import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MonitoringService, LoaderService } from '../../services/index';

import { environment } from '../../../environments/environment';

import { DateTimeAdapter } from 'ng-pick-datetime';

const scheduleMicrotask = Promise.resolve( null );


@Component( {
  moduleId: module.id,
  templateUrl: 'clock.component.html',
  styleUrls: ['clock.component.scss'],
  providers: []
} )


export class ClockComponent implements OnInit {
  clockForm: FormGroup;
  clock: Object = null;
  timeZone = '';

  constructor(
    private fb: FormBuilder,
    private loader: LoaderService,
    private monitoringService: MonitoringService,
    dateTimeAdapter: DateTimeAdapter<any>,
  ) {
    dateTimeAdapter.setLocale('iso-8601');
  }

  ngOnInit() {
    this.updateComponent();
    this.updateForm();
  }

  updateForm() {
    this.clockForm = this.fb.group( {
      dateTime: '',
    } );
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
          this.timeZone = clock['timezone'];
        }

        this.loader.display(false);
      });
  }

  onSynchronize() {
    this.monitoringService.synchronizeClock()
      .subscribe(_ => this.updateComponent());
  }


  onSubmit() {
    const formModel = this.clockForm.value;
    this.monitoringService.changeClock(formModel.dateTime, this.timeZone)
      .subscribe(_ => this.updateComponent());
  }
}

