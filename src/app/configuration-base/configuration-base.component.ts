import { Subscription } from 'rxjs';

import { MONITORING_STATE, string2MonitoringState } from '@app/models';
import { LoaderService, EventService, MonitoringService } from '@app/services';


export class ConfigurationBaseComponent {

  monitoringState: MONITORING_STATE;
  monitoringStates: any = MONITORING_STATE;
  baseSubscriptions: Subscription[];
  editableStates: MONITORING_STATE[] = [MONITORING_STATE.READY]

  constructor(
    public eventService: EventService,
    public loader: LoaderService,
    public monitoringService: MonitoringService,
  ) { }

  initialize() {
    this.monitoringService.getMonitoringState()
    .subscribe({
      next: monitoringState => {
        this.monitoringState = monitoringState;
        this.onStateChange();
      },
      error: _ => {
        this.monitoringState = MONITORING_STATE.UNDEFINED;
        this.onStateChange();
      }
    });

    this.eventService.isConnected()
      .subscribe(connected => {
        if (connected) {
          this.loader.clearMessage();
        }
        else {
          this.monitoringState = MONITORING_STATE.UNDEFINED;
          this.onStateChange();
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
      this.loader.setMessage($localize`:@@message system error:The system is not working correctly, you can't make changes in the configuration!`);
    } else if (this.monitoringState === MONITORING_STATE.UNDEFINED) {
      this.loader.setMessage($localize`:@@message lost connection:Lost connection to the security system!`);
    } else if (!this.editableStates.includes(this.monitoringState)) {
      this.loader.setMessage($localize`:@@message system not ready:The system is not ready, you can't make changes in the configuration!`);
    } else {
      this.loader.clearMessage();
    }
  }
}
