import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ArmType, String2ArmType, Alert, SensorType } from '../models';
import { ConfigurationBaseComponent } from '../configuration-base/configuration-base.component';
import { MonitoringState, String2MonitoringState } from '../models';
import { AlertService, EventService, LoaderService, SensorService, AuthenticationService } from '../services';
import { MonitoringService } from '../services';

import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

@Component({
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.scss'],
  providers: []
})

export class HomeComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy  {
  ArmType: any = ArmType;
  alert: Alert;
  armState: ArmType;
  monitoringState: MonitoringState;
  sensorAlert: boolean;
  sensorTypes: SensorType [] = [];

  constructor(
    public authService: AuthenticationService,
    public loader: LoaderService,
    public eventService: EventService,
    public monitoringService: MonitoringService,
    public router: Router,

    private snackBar: MatSnackBar,
    private alertService: AlertService,
    private sensorService: SensorService,
  ) {
    super(authService, eventService, loader, monitoringService, router);
  }

  ngOnInit() {
    super.initialize();

    // ALERT STATE: read and subscribe for changes
    this.alertService.getAlert()
      .subscribe(alert => {
        this.alert = alert;
      },
      error => {
        if (error.status == 403) {
          super.logout();
        }
      }
    );
    this.eventService.listen('alert_state_change')
      .subscribe(alert => {
        this.alert = alert;
      },
      error => {
        if (error.status == 403) {
          super.logout();
        }
      }
    );

    // ARM STATE: read and subscribe for changes
    this.monitoringService.getArmState()
      .subscribe(armState => this.armState = armState,
      error => {
        if (error.status == 403) {
          super.logout();
        }
      }
    );
    this.eventService.listen('arm_state_change')
      .subscribe(armState => this.armState = String2ArmType(armState),
      error => {
        if (error.status == 403) {
          super.logout();
        }
      }
    );

    // SENSORS ALERT STATE: read and subscribe for changes
    this.sensorService.getAlert()
      .subscribe(alert => {
        this.sensorAlert = alert;
      },
      error => {
        if (error.status == 403) {
          super.logout();
        }
      }
    );

    this.sensorService.getSensorTypes()
      .subscribe(st => this.sensorTypes = st,
        error => {
          if (error.status == 403) {
            super.logout();
          }
        }
    );

    this.eventService.listen('sensors_state_change')
      .subscribe(alert => {
        this.sensorAlert = alert;
      },
      error => {
        if (error.status == 403) {
          super.logout();
        }
      }
    );

    this.monitoringService.getMonitoringState()
      .subscribe(monitoringState => this.monitoringState = monitoringState,
      error => {
        if (error.status == 403) {
          super.logout();
        }
      }
    );
    this.eventService.listen('system_state_change')
      .subscribe(monitoringState => this.monitoringState = String2MonitoringState(monitoringState),
      error => {
        if (error.status == 403) {
          super.logout();
        }
      }
    );
  }

  ngOnDestroy() {
    super.destroy();
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
    return this.sensorAlert ||
      this.armState !== ArmType.DISARMED ||
      this.monitoringState !== MonitoringState.READY ||
      this.monitoringState === MonitoringState.READY && this.alert;
  }

  getSensorTypeName(sensorTypeId: number) {
    if (this.sensorTypes.length && sensorTypeId != null) {
      return this.sensorTypes.find(x => x.id === sensorTypeId).name;
    }

    return '';
  }
}
