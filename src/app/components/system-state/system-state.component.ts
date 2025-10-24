import { Component, Inject, OnInit } from '@angular/core';

import {
  ARM_TYPE,
  MONITORING_STATE,
  POWER_STATE,
  string2ArmType,
  string2MonitoringState,
  string2PowerState
} from '@app/models';
import { AlertService, AuthenticationService, EventService, MonitoringService, SensorService } from '@app/services';
import { AUTHENTICATION_SERVICE } from '@app/tokens';

@Component({
  selector: 'app-system-state',
  templateUrl: './system-state.component.html',
  styleUrls: ['./system-state.component.scss'],
  providers: [],
  standalone: false
})
export class SystemStateComponent implements OnInit {
  monitoringStates: any = MONITORING_STATE;
  monitoringState: MONITORING_STATE = MONITORING_STATE.READY;
  armTypes: any = ARM_TYPE;
  armState: ARM_TYPE = ARM_TYPE.DISARMED;
  powerStates: any = POWER_STATE;
  powerState: POWER_STATE = POWER_STATE.UNDEFINED;
  sensorAlert: boolean;
  sensorError: boolean;

  // true=syren / false=syren muted / null=no syren
  syrenAlert: boolean;

  constructor(
    @Inject('AlertService') private alertService: AlertService,
    @Inject(AUTHENTICATION_SERVICE) private authService: AuthenticationService,
    @Inject('EventService') private eventService: EventService,
    @Inject('MonitoringService') private monitoringService: MonitoringService,
    @Inject('SensorService') private sensorService: SensorService
  ) {}

  ngOnInit() {
    this.authService.isDeviceRegistered().subscribe(isRegistered => {
      if (isRegistered) {
        this.updateComponent();
      }
    });

    this.eventService.isConnected().subscribe(connected => {
      if (connected) {
        this.updateComponent();
      }
    });
  }

  updateComponent() {
    this.monitoringService.getArmState().subscribe({
      next: armState => (this.armState = armState),
      error: _ => (this.armState = ARM_TYPE.UNDEFINED)
    });
    this.sensorService.getAlert().subscribe(alert => (this.sensorAlert = alert));
    this.sensorService.getError().subscribe(error => (this.sensorError = error));
    this.alertService.getAlert().subscribe(alert => (this.syrenAlert = alert != null ? !alert.silent : null));
    this.monitoringService.getMonitoringState().subscribe({
      next: monitoringState => (this.monitoringState = monitoringState),
      error: () => (this.monitoringState = MONITORING_STATE.UNDEFINED)
    });
    this.monitoringService.getPowerState().subscribe(powerState => (this.powerState = powerState));

    this.eventService.listen('arm_state_change').subscribe(armState => (this.armState = string2ArmType(armState)));
    this.eventService.listen('sensors_state_change').subscribe(alert => (this.sensorAlert = alert));
    this.eventService.listen('sensors_error_change').subscribe(error => (this.sensorError = error));
    this.eventService
      .listen('system_state_change')
      .subscribe(monitoringState => (this.monitoringState = string2MonitoringState(monitoringState)));
    this.eventService.listen('syren_state_change').subscribe(event => (this.syrenAlert = event));
    this.eventService
      .listen('power_state_change')
      .subscribe(powerState => (this.powerState = string2PowerState(powerState)));

    this.eventService.listen('connect').subscribe(event => {
      this.monitoringService.getArmState().subscribe(armState => (this.armState = armState));
      this.monitoringService
        .getMonitoringState()
        .subscribe(monitoringState => (this.monitoringState = monitoringState));
    });

    this.eventService.listen('disconnect').subscribe(event => {
      this.armState = ARM_TYPE.UNDEFINED;
      this.monitoringState = MONITORING_STATE.UNDEFINED;
    });
  }

  isSensorIndicatorVisible() {
    return (
      this.monitoringState === MONITORING_STATE.ARMED ||
      this.monitoringState === MONITORING_STATE.READY ||
      this.monitoringState === MONITORING_STATE.ARM_DELAY
    );
  }

  getArmClass() {
    if (this.monitoringState == MONITORING_STATE.ARM_DELAY) return 'warning';
    else if (
      this.monitoringState == MONITORING_STATE.SABOTAGE ||
      this.monitoringState == MONITORING_STATE.ARMED ||
      this.monitoringState == MONITORING_STATE.ALERT ||
      this.monitoringState == MONITORING_STATE.ALERT_DELAY
    ) {
      return 'danger';
    }
  }
}
