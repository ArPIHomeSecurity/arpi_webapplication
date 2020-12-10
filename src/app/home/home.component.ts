import { Component, Inject, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Alert, ARM_TYPE, MONITORING_STATE, string2ArmType, string2MonitoringState, SensorType } from '../models';
import { AlertService, EventService, LoaderService, MonitoringService, SensorService } from '../services';

import { environment } from '../../environments/environment';


@Component({
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.scss'],
  providers: []
})

export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('snackbarTemplate') snackbarTemplate: TemplateRef<any>;
  action: string;

  armTypes: any = ARM_TYPE;
  alert: Alert;
  armState: ARM_TYPE;
  monitoringState: MONITORING_STATE;
  sensorAlert: boolean;
  sensorTypes: SensorType [] = [];

  constructor(
    @Inject('AlertService') private alertService: AlertService,
    @Inject('EventService') public eventService: EventService,
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,
    @Inject('SensorService') private sensorService: SensorService,

    private snackBar: MatSnackBar,
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
      .subscribe(armState => this.armState = string2ArmType(armState));

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
      .subscribe(monitoringState => this.monitoringState = string2MonitoringState(monitoringState));
  }

  ngOnDestroy(){
    this.loader.clearMessage();
  }

  armChanged(event) {
    if (event.value === 'AWAY') {
      this.action = 'armed away';
      this.monitoringService.arm(ARM_TYPE.AWAY);
      this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration});
    } else if (event.value === 'STAY') {
      this.action = 'armed stay';
      this.monitoringService.arm(ARM_TYPE.STAY);
      this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration});
    } else if (event.value === 'DISARMED') {
      this.action = 'disarmed';
      this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration});
      this.monitoringService.disarm();
    }
  }

  armDisabled() {
    return this.sensorAlert ||
      this.armState !== ARM_TYPE.DISARMED ||
      this.monitoringState !== MONITORING_STATE.READY ||
      this.monitoringState === MONITORING_STATE.READY && this.alert;
  }

  getSensorTypeName(sensorTypeId: number) {
    if (this.sensorTypes.length && sensorTypeId != null) {
      return this.sensorTypes.find(x => x.id === sensorTypeId).name;
    }

    return '';
  }
}
