import { Component, OnInit } from '@angular/core';

import { AlertService, EventService, SensorService, AuthenticationService } from '../services';
import { MonitoringService } from '../services';
import { ArmType, String2ArmType } from '../models';
import { MonitoringState, String2MonitoringState } from '../models';
import { Router } from '@angular/router';


@Component({
  selector: 'app-system-state',
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
    private authService: AuthenticationService,
    private alertService: AlertService,
    private eventService: EventService,
    private router: Router,
    private sensorService: SensorService,
    private monitoringService: MonitoringService
  ) { }

  ngOnInit() {
    if (this.authService.getToken()) {
      this.updateComponent();
    } else {
      this.authService.isDeviceRegistered()
      .subscribe(isRegistered => {
        if (isRegistered) {
          this.updateComponent();
        }
      });
    }
  }
  
  updateComponent() {
    this.monitoringService.getArmState()
      .subscribe(armState => this.armState = armState,
      error => {
        if (error.status == 403) {
          this.authService.logout();
          this.router.navigate(['']);
        }
      }
    );
    this.sensorService.getAlert()
      .subscribe(alert =>  this.sensorAlert = alert,
      error => {
        if (error.status == 403) {
          this.authService.logout();
          this.router.navigate(['']);
        }
      }
    );
    this.alertService.getAlert()
      .subscribe(alert => this.syrenAlert = (alert != null) ? true : null,
      error => {
        if (error.status == 403) {
          this.authService.logout();
          this.router.navigate(['']);
        }
      }
    );
    this.monitoringService.getMonitoringState()
      .subscribe(monitoringState => this.monitoringState = monitoringState,
      error => {
        if (error.status == 403) {
          this.authService.logout();
          this.router.navigate(['']);
        }
      }
    );

    this.eventService.listen('arm_state_change')
      .subscribe(armState => this.armState = String2ArmType(armState),
      error => {
        if (error.status == 403) {
          this.authService.logout();
          this.router.navigate(['']);
        }
      }
    );
    this.eventService.listen('sensors_state_change')
      .subscribe(alert => this.sensorAlert = alert,
        error => {
          if (error.status == 403) {
            this.authService.logout();
            this.router.navigate(['']);
          }
        }
    );
    this.eventService.listen('system_state_change')
      .subscribe(monitoringState => this.monitoringState = String2MonitoringState(monitoringState),
      error => {
        if (error.status == 403) {
          this.authService.logout();
          this.router.navigate(['']);
        }
      }
    );
    this.eventService.listen('syren_state_change')
      .subscribe(event => this.syrenAlert = event,
        error => {
          if (error.status == 403) {
            this.authService.logout();
            this.router.navigate(['']);
          }
        }
    );
  }

  isSensorIndicatorVisible() {
    return this.monitoringState === MonitoringState.ARMED ||
      this.monitoringState === MonitoringState.READY;
  }
}
