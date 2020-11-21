import { Subscription } from 'rxjs';

import { MonitoringState, String2MonitoringState } from '../models';
import { LoaderService, EventService, MonitoringService } from '../services';


export class ConfigurationBaseComponent {

  monitoringState: MonitoringState;
  MonitoringState: any = MonitoringState;
  baseSubscriptions: Subscription[];

  constructor(
    public eventService: EventService,
    public loader: LoaderService,
    public monitoringService: MonitoringService,
  ) { }

  initialize() {
    this.monitoringService.getMonitoringState()
      .subscribe(monitoringState => {
        this.monitoringState = monitoringState;
        this.onStateChange();
      }
    );

    this.baseSubscriptions = [];
    this.baseSubscriptions.push(
      this.eventService.listen('system_state_change')
        .subscribe(monitoringState => {
          this.monitoringState = String2MonitoringState(monitoringState);
          this.onStateChange();
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

  onStateChange() {
    if (this.monitoringState === MonitoringState.ERROR) {
      this.loader.setMessage('system-error');
    } else if (this.monitoringState !== MonitoringState.READY) {
      this.loader.setMessage('system-not-ready');
    } else {
      this.loader.clearMessage();
    }
  }
}
