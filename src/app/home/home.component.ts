import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';

import { ArmType, String2ArmType, Alert } from '../models/index';
import { MonitoringState, String2MonitoringState } from '../models/index';
import { AlertService, SensorService, EventService } from '../services/index';
import { MonitoringService } from '../services/index';

import { environment } from '../../environments/environment';

@Component({
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.scss'],
  providers: []
})

export class HomeComponent implements OnInit {
  ArmType: any = ArmType;
  alert: Alert;
  arm_state: ArmType;
  monitoringState: MonitoringState = MonitoringState.READY;
  sensor_alert: boolean;

  constructor(
          private snackBar: MatSnackBar,
          private alertService: AlertService,
          private monitoringService: MonitoringService,
          private sensorService: SensorService,
          private eventService: EventService
  ) {}

  ngOnInit() {
    // ALERT STATE: read and subscribe for changes
    this.alertService.getAlert()
      .subscribe(alert => {
        this.alert = alert;
      }
    );
    this.eventService.listen('alert_state_change')
      .subscribe(alert => {
        // TODO: why JSON parse???
        this.alert = alert;
      }
    );

    // ARM STATE: read and subscribe for changes
    this.monitoringService.getArmState()
      .subscribe(arm_state => this.arm_state = arm_state);
    this.eventService.listen('arm_state_change')
      .subscribe(arm_state => this.arm_state = String2ArmType(arm_state));

    // SENSORS ALERT STATE: read and subscribe for changes
    this.sensorService.getAlert()
      .subscribe(alert => {
        this.sensor_alert = alert;
      }
    );

    this.eventService.listen('sensors_state_change')
      .subscribe(alert => {
        this.sensor_alert = alert;
      }
    );

    this.monitoringService.getMonitoringState()
      .subscribe(monitoringState => this.monitoringState = monitoringState);
    this.eventService.listen('system_state_change')
      .subscribe(monitoringState => this.monitoringState = String2MonitoringState(monitoringState));
  }

  arm_changed(event) {
    if (event.value === 'AWAY') {
      this.snackBar.open('Armed', null, {duration: environment.SNACK_DURATION});
      this.monitoringService.arm(ArmType.AWAY);
    } else if (event.value === 'STAY') {
      this.monitoringService.arm(ArmType.STAY);
      this.snackBar.open('Armed', null, {duration: environment.SNACK_DURATION});
    } else if (event.value === 'DISARMED') {
        this.snackBar.open('Disarmed', null, {duration: environment.SNACK_DURATION});
        this.monitoringService.disarm();
      }
  }

  arm_disabled() {
    return this.sensor_alert ||
      this.arm_state !== ArmType.DISARMED ||
      this.monitoringState !== MonitoringState.READY ||
      this.monitoringState === MonitoringState.READY && this.alert;
  }
}