import { Component, ViewChild, OnInit, Inject } from '@angular/core';

import { MatPaginator } from '@angular/material/paginator';
import { DataSource } from '@angular/cdk/collections';
import { Observable, of } from 'rxjs';

import { AlertType, Alert, Sensor } from '../models';
import { AlertService, EventService, SensorService } from '../services';


export class AlertHistory extends DataSource<any> {
  constructor(private alertHistory: Observable<Alert[]>, private paginator: MatPaginator) {
    super();
  }

  connect(): Observable<Alert[]> {
    return this.alertHistory;
  }

  disconnect() {}
}


@Component({
  templateUrl: 'alert-list.component.html',
  styleUrls: ['alert-list.component.scss'],
  providers: []
})
export class AlertListComponent implements OnInit {
  AlertType: any = AlertType;
  alertHistory: AlertHistory | null;
  displayedColumns = ['alertType', 'startTime', 'endTime', 'sensors'];
  sensors: Sensor[];

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    @Inject('AlertService') private alertService: AlertService,
    @Inject('EventService') private eventService: EventService,
    @Inject('SensorService') private sensorService: SensorService
    ) {}

  ngOnInit() {
    this.alertService.getAlerts()
      .subscribe(alerts => {
        this.alertHistory = new AlertHistory(of(alerts), this.paginator);
      }
    );

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
