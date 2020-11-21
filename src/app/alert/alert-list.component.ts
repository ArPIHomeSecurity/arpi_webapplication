import { Component, ViewChild, Inject, OnInit, OnDestroy } from '@angular/core';

import { MatPaginator } from '@angular/material/paginator';
import { DataSource } from '@angular/cdk/collections';

import { Observable, of, forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ALERT_TYPE, Alert, Sensor } from '../models';
import { AlertService, EventService, LoaderService, SensorService } from '../services';

const scheduleMicrotask = Promise.resolve( null );


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
export class AlertListComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  readonly alertType: any = ALERT_TYPE;
  alertHistory: AlertHistory | null;
  displayedColumns = ['alertType', 'startTime', 'endTime', 'sensors'];
  sensors: Sensor[];


  constructor(
    @Inject('AlertService') private alertService: AlertService,
    @Inject('EventService') private eventService: EventService,
    @Inject('SensorService') private sensorService: SensorService,
    @Inject('LoaderService') private loader: LoaderService
  ) {}

  ngOnInit() {
    // avoid ExpressionChangedAfterItHasBeenCheckedError
    // https://github.com/angular/angular/issues/17572#issuecomment-323465737
    scheduleMicrotask.then(() => {
      this.loader.display( true );
    } );

    forkJoin({
      alerts: this.alertService.getAlerts(),
      sensors: this.sensorService.getSensors()
    })
    .pipe(finalize(() => this.loader.display(false)))
    .subscribe(results => {
      this.alertHistory = new AlertHistory(of(results.alerts), this.paginator);
      this.sensors = results.sensors;
    });

    this.eventService.listen('syren_state_change')
      .subscribe(event => {
          this.alertService.getAlerts()
          .subscribe(alerts => {
            this.alertHistory = new AlertHistory(of(alerts), this.paginator);
        });
      }
    );
  }

  ngOnDestroy() {
    this.loader.clearMessage();
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
