import { Subscription } from 'rxjs';

import { MonitoringState, String2MonitoringState } from '../models';
import { LoaderService, EventService, MonitoringService } from '../services';

export class ConfigurationBaseComponent {

  monitoringState: MonitoringState;
  MonitoringState: any = MonitoringState;
  baseSubscriptions: Subscription[];

  constructor(
    public loader: LoaderService,
    public eventService: EventService,
    public monitoringService: MonitoringService
  ) { }

  initialize() {
    this.monitoringService.getMonitoringState()
      .subscribe(monitoringState => {
        this.monitoringState = monitoringState;
        this.onStateChange();
    });

    this.baseSubscriptions = [];
    this.baseSubscriptions.push(
      this.eventService.listen('system_state_change')
        .subscribe(monitoringState => {
          this.monitoringState = String2MonitoringState(monitoringState);
          this.onStateChange();
    }));
  }

  destroy() {
    this.baseSubscriptions.forEach(_ => _.unsubscribe());
    this.baseSubscriptions = [];
    this.loader.clearMessage();
  }

  onStateChange() {
    if (this.monitoringState !== MonitoringState.READY) {
      this.loader.setMessage('The system is not ready, you can\'t make changes in the configuration!');
    } else {
      this.loader.clearMessage();
    }
  }
}
