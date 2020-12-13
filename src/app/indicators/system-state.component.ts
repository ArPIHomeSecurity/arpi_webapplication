import { Component, Inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ARM_TYPE, MONITORING_STATE, string2MonitoringState, string2ArmType } from '../models';
import { AlertService, AuthenticationService, EventService, MonitoringService, SensorService } from '../services';


@Component({
  selector: 'app-system-state',
  templateUrl: './system-state.component.html',
  styleUrls: ['./system-state.component.scss'],
  providers: []
})
export class SystemStateComponent implements OnInit {
  monitoringStates: any = MONITORING_STATE;
  armTypes: any = ARM_TYPE;
  armState: ARM_TYPE;
  sensorAlert: boolean;

  // true=syren / false=syren muted / null=no syren
  syrenAlert: boolean;
  monitoringState: MONITORING_STATE;

  constructor(
    @Inject('AlertService') private alertService: AlertService,
    @Inject('AuthenticationService') private authService: AuthenticationService,
    @Inject('EventService') private eventService: EventService,
    @Inject('MonitoringService') private monitoringService: MonitoringService,
    @Inject('SensorService') private sensorService: SensorService,
    private router: Router
  ) { }

  ngOnInit() {
    this.authService.isDeviceRegistered()
      .subscribe(isRegistered => {
        if (isRegistered) {
          this.updateComponent();
        }
      });
  }

  updateComponent() {
    this.monitoringService.getArmState()
      .subscribe(armState => this.armState = armState);
    this.sensorService.getAlert()
      .subscribe(alert =>  this.sensorAlert = alert);
    this.alertService.getAlert()
      .subscribe(alert => this.syrenAlert = (alert != null) ? true : null);
    this.monitoringService.getMonitoringState()
      .subscribe(monitoringState => this.monitoringState = monitoringState);

    this.eventService.listen('arm_state_change')
      .subscribe(armState => this.armState = string2ArmType(armState));
    this.eventService.listen('sensors_state_change')
      .subscribe(alert => this.sensorAlert = alert);
    this.eventService.listen('system_state_change')
      .subscribe(monitoringState => this.monitoringState = string2MonitoringState(monitoringState));
    this.eventService.listen('syren_state_change')
      .subscribe(event => this.syrenAlert = event);

    this.eventService.listen('disconnect')
      .subscribe(event => {
        this.armState = null;
        this.monitoringState = null;
      });
  }

  isSensorIndicatorVisible() {
    return this.monitoringState === MONITORING_STATE.ARMED ||
      this.monitoringState === MONITORING_STATE.READY;
  }
}
