import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ArmType, String2ArmType, Alert, SensorType } from '../models';
import { MonitoringState, String2MonitoringState } from '../models';
import { AlertService, EventService, LoaderService, SensorService } from '../services';
import { MonitoringService } from '../services';

import { environment } from '../../environments/environment';


@Component({
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.scss'],
  providers: []
})

export class HomeComponent implements OnInit {
  @ViewChild('snacbarTemplate') snackbarTemplate: TemplateRef<any>;
  action: string;

  ArmType: any = ArmType;
  alert: Alert;
  armState: ArmType;
  monitoringState: MonitoringState;
  sensorAlert: boolean;
  sensorTypes: SensorType [] = [];

  constructor(
    public loader: LoaderService,
    public eventService: EventService,
    public monitoringService: MonitoringService,

    private snackBar: MatSnackBar,
    private alertService: AlertService,
    private sensorService: SensorService,
  ) {

  }

  ngOnInit() {
    // ALERT STATE: read and subscribe for changes
    this.alertService.getAlert()
      .subscribe(alert => {
        this.alert = alert;
      }
    );
    this.eventService.listen('alert_state_change')
      .subscribe(alert => {
        this.alert = alert;
      }
    );

    // ARM STATE: read and subscribe for changes
    this.monitoringService.getArmState()
      .subscribe(armState => this.armState = armState);
    this.eventService.listen('arm_state_change')
      .subscribe(armState => this.armState = String2ArmType(armState));

    // SENSORS ALERT STATE: read and subscribe for changes
    this.sensorService.getAlert()
      .subscribe(alert => {
        this.sensorAlert = alert;
      }
    );

    this.sensorService.getSensorTypes()
      .subscribe(st => this.sensorTypes = st);

    this.eventService.listen('sensors_state_change')
      .subscribe(alert => {
        this.sensorAlert = alert;
      }
    );

    this.monitoringService.getMonitoringState()
      .subscribe(monitoringState => this.monitoringState = monitoringState);
    this.eventService.listen('system_state_change')
      .subscribe(monitoringState => this.monitoringState = String2MonitoringState(monitoringState));
  }

  armChanged(event) {
    if (event.value === 'AWAY') {
      this.action = 'armed away'
      this.monitoringService.arm(ArmType.AWAY);
      this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.SNACK_DURATION});
    } else if (event.value === 'STAY') {
      this.action = 'armed stay'
      this.monitoringService.arm(ArmType.STAY);
      this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.SNACK_DURATION});
    } else if (event.value === 'DISARMED') {
      this.action = 'disarmed'
      this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.SNACK_DURATION});
      this.monitoringService.disarm();
    }
  }

  armDisabled() {
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
