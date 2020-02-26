import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { ConfigurationBaseComponent } from '../../configuration-base/configuration-base.component';
import { DateTimeAdapter } from 'ng-pick-datetime';
import { AuthenticationService, EventService, LoaderService, MonitoringService } from '../../services';

const scheduleMicrotask = Promise.resolve( null );


@Component( {
  moduleId: module.id,
  templateUrl: 'clock.component.html',
  styleUrls: ['clock.component.scss'],
  providers: []
} )


export class ClockComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {
  clockForm: FormGroup;
  clock: Object = null;
  timeZone = '';

  constructor(
    public authService: AuthenticationService,
    public loader: LoaderService,
    public eventService: EventService,
    public monitoringService: MonitoringService,
    public router: Router,

    private fb: FormBuilder,
    dateTimeAdapter: DateTimeAdapter<any>,
  ) {
    super(authService, eventService, loader, monitoringService, router);
    dateTimeAdapter.setLocale('iso-8601');
  }

  ngOnInit() {
    super.initialize();

    this.updateComponent();
    this.updateForm();
  }

  ngOnDestroy() {
    super.destroy();
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
      },
      error => {
        if (error.status == 403) {
          super.logout();
        }
      }
    );
  }

  onSynchronize() {
    this.monitoringService.synchronizeClock()
      .subscribe(_ => this.updateComponent(),
      error => {
        if (error.status == 403) {
          super.logout();
        }
      }
    );
  }


  onSubmit() {
    const formModel = this.clockForm.value;
    this.monitoringService.changeClock(formModel.dateTime, this.timeZone)
      .subscribe(_ => this.updateComponent(),
      error => {
        if (error.status == 403) {
          super.logout();
        }
      }
    );
  }
}

