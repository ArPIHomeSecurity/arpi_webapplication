import { Subscription } from 'rxjs';

import { MonitoringState, String2MonitoringState } from '../models';
import { LoaderService, EventService, MonitoringService, AuthenticationService } from '../services';
import { Router } from '@angular/router';

export class ConfigurationBaseComponent {

  monitoringState: MonitoringState;
  MonitoringState: any = MonitoringState;
  baseSubscriptions: Subscription[];

  constructor(
    public authService: AuthenticationService,
    public eventService: EventService,
    public loader: LoaderService,
    public monitoringService: MonitoringService,
    public router: Router
  ) { }

  initialize() {
    this.monitoringService.getMonitoringState()
      .subscribe(monitoringState => {
        this.monitoringState = monitoringState;
        this.onStateChange();
      },
      error => {
        this.logout();
      }
    );

    this.baseSubscriptions = [];
    this.baseSubscriptions.push(
      this.eventService.listen('system_state_change')
        .subscribe(monitoringState => {
          this.monitoringState = String2MonitoringState(monitoringState);
          this.onStateChange();
        },
        error => {
          if (error.status == 403) {
            this.logout();
          }
        }
      )
    );
  }

  destroy() {
    if (this.baseSubscriptions) {
      this.baseSubscriptions.forEach(_ => _.unsubscribe());
      this.baseSubscriptions = [];
    }
    this.loader.clearMessage();
    this.loader.display(false);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onStateChange() {
    if (this.monitoringState == MonitoringState.ERROR) {
      this.loader.setMessage('The system is not working correctly, you can\'t make changes in the configuration!')
    }
    else if (this.monitoringState !== MonitoringState.READY) {
      this.loader.setMessage('The system is not ready, you can\'t make changes in the configuration!');
    }
    else {
      this.loader.clearMessage();
    }
  }
}
