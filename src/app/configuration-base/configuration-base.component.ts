import { Subscription } from 'rxjs';

import { MONITORING_STATE, string2MonitoringState } from '../models';
import { LoaderService, EventService, MonitoringService } from '../services';


export class ConfigurationBaseComponent {

  monitoringState: MONITORING_STATE;
  monitoringStates: any = MONITORING_STATE;
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

    this.eventService.isConnected()
      .subscribe(connected => {
        if (connected) {
          this.loader.clearMessage();
        }
        else {
          this.loader.setMessage('Lost connection to the backend service!');
          this.monitoringState = null;
        }
      });

    this.baseSubscriptions = [
      this.eventService.listen('system_state_change')
        .subscribe(monitoringState => {
          this.monitoringState = string2MonitoringState(monitoringState);
          this.onStateChange();
        })
    ];
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
    if (this.monitoringState === MONITORING_STATE.ERROR) {
      this.loader.setMessage('system-error');
    } else if (this.monitoringState !== MONITORING_STATE.READY) {
      this.loader.setMessage('system-not-ready');
    } else {
      this.loader.clearMessage();
    }
  }
}
