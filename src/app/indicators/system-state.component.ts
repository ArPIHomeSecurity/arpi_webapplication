import { Component, OnInit } from '@angular/core';

import { AlertService, EventService, SensorService } from '../services';
import { MonitoringService } from '../services';
import { ArmType, String2ArmType } from '../models';
import { MonitoringState, String2MonitoringState } from '../models';

import { environment } from '../../environments/environment';

@Component({
  selector: 'system-state',
  templateUrl: './system-state.component.html',
  styleUrls: ['./system-state.component.scss'],
  providers: []
})
export class SystemStateComponent implements OnInit {
  MonitoringState: any = MonitoringState;
  ArmType: any = ArmType;
  sensorAlert: boolean;

  // true=syren / false=syren muted / null=no syren
  syrenAlert: boolean;
  armState: ArmType;
  monitoringState: MonitoringState;

  constructor(
          private alertService: AlertService,
          private eventService: EventService,
          private sensorService: SensorService,
          private monitoringService: MonitoringService
  ) { }

  ngOnInit() {
    this.monitoringService.getArmState()
      .subscribe(armState => this.armState = armState);
    this.sensorService.getAlert()
      .subscribe(alert =>  this.sensorAlert = alert);
    this.alertService.getAlert()
      .subscribe(alert => this.syrenAlert = (alert != null) ? true : null);
    this.monitoringService.getMonitoringState()
      .subscribe(monitoringState => this.monitoringState = monitoringState);

    this.eventService.listen('arm_state_change')
      .subscribe(armState => this.armState = String2ArmType(armState));
    this.eventService.listen('sensors_state_change')
      .subscribe(alert => this.sensorAlert = alert);
    this.eventService.listen('system_state_change')
      .subscribe(monitoringState => this.monitoringState = String2MonitoringState(monitoringState));
    this.eventService.listen('syren_state_change')
      .subscribe(event => this.syrenAlert = event);
  }

  isSensorIndicatorVisible(){
    return this.monitoringState === MonitoringState.ARMED ||
      this.monitoringState === MonitoringState.READY;
  }
}
