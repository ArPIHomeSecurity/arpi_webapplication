import { Component, ViewChild, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { MatPaginator } from '@angular/material';
import { DataSource } from '@angular/cdk/collections';
import { Observable, of } from 'rxjs';

import { ArmType, Alert, AlertSensor, Sensor } from '../models/index';
import { AlertService, EventService, SensorService } from '../services/index';

@Component({
  moduleId: module.id,
  templateUrl: 'alert-list.component.html',
  styleUrls: ['alert-list.component.scss'],
  providers: []
})
export class AlertListComponent implements OnInit {
  ArmType:any = ArmType;
  alertHistory : AlertHistory | null;
  displayedColumns = ['arm_type', 'start_time', 'end_time', 'sensors'];
  sensors: Sensor[];

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private router: Router,
    private alertService: AlertService,
    private eventService: EventService,
    private sensorService: SensorService) {}

  ngOnInit() {
    this.alertService.getAlerts()
      .subscribe(alerts => {
        this.alertHistory = new AlertHistory(of(alerts), this.paginator);
    });

    this.eventService.listen('syren_state_change')
      .subscribe(event => {
          this.alertService.getAlerts()
          .subscribe(alerts => {
            this.alertHistory = new AlertHistory(of(alerts), this.paginator);
        });
      }
    );

    this.sensorService.getSensors()
      .subscribe(sensors => {
        this.sensors = sensors;
    });
  }

  sensorExists(id) {
    let exists = false;
    this.sensors.forEach((sensor) => {
      if (sensor.id === id) {
          exists = true;
      }
    });
    return exists;
  }
}

export class AlertHistory extends DataSource<any> {
  constructor(private _alert_history: Observable<Alert[]>, private _paginator: MatPaginator) {
    super();
  }

  connect(): Observable<Alert[]>{
    return this._alert_history;
  }

  disconnect() {}
}
