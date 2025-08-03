import { Inject, Injectable, Injector } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

import { SENSORS, SENSOR_TYPES } from '@app/demo/configuration';
import { Sensor, SensorType } from '@app/models';
import { AUTHENTICATION_SERVICE } from '@app/tokens';
import { getSessionValue, setSessionValue } from '@app/utils';
import { environment } from '@environments/environment';
import { AuthenticationService } from './authentication.service';
import { EventService } from './event.service';
import { MonitoringService } from './monitoring.service';

@Injectable({
  providedIn: 'root'
})
export class SensorService {
  sensors: Sensor[];
  types: SensorType[] = SENSOR_TYPES;
  channels: boolean[] = [];

  constructor(
    @Inject(AUTHENTICATION_SERVICE) private authService: AuthenticationService,
    @Inject('EventService') private eventService: EventService,

    // resolving circular dependency with AreaService
    private injector: Injector
  ) {
    // channels are numbered 1..N
    for (let i = 0; i < environment.channelCount; i++) {
      this.channels.push(false);
    }

    this.sensors = getSessionValue('SensorService.sensors', SENSORS);
  }

  getSensors(onlyAlerting = false): Observable<Sensor[]> {
    // send variables by value
    return of(Object.assign([], this.sensors)).pipe(
      delay(environment.delay),
      map(_ => {
        this.authService.updateUserToken('user.session');
        return _;
      })
    );
  }

  getSensor(sensorId: number): Observable<Sensor> {
    // send variables by value
    return of(
      Object.assign(
        {},
        this.sensors.find(s => s.id === sensorId)
      )
    );
  }

  createSensor(sensor: Sensor): Observable<Sensor> {
    // get the maximum id and increment it
    sensor.id = Math.max.apply(Math.max, this.sensors.map(s => s.id).concat([0])) + 1;
    sensor.alert = sensor.channel === -1 ? false : this.channels[sensor.channel];
    this.sensors.push(sensor);
    setSessionValue('SensorService.sensors', this.sensors);

    const alertState = this.sensors.map(s => s.alert && s.enabled).reduce((a1, a2) => a1 || a2, false);
    this.eventService.updateSensorsState(alertState);
    return of(sensor);
  }

  updateSensor(sensor: Sensor): Observable<Sensor> {
    const tmpSensor = this.sensors.find(s => s.id === sensor.id);
    const index = this.sensors.indexOf(tmpSensor);
    sensor.alert = sensor.channel === -1 ? false : this.channels[sensor.channel];
    this.sensors[index] = sensor;
    setSessionValue('SensorService.sensors', this.sensors);

    const alertState = this.sensors.map(s => s.alert && s.enabled).reduce((a1, a2) => a1 || a2, false);
    this.eventService.updateSensorsState(alertState);
    return of(sensor);
  }

  deleteSensor(sensorId: number): Observable<boolean> {
    this.sensors = this.sensors.filter(s => s.id !== sensorId);
    setSessionValue('SensorService.sensors', this.sensors);

    const alertState = this.sensors.map(s => s.alert && s.enabled).reduce((a1, a2) => a1 || a2, false);
    this.eventService.updateSensorsState(alertState);
    return of(true);
  }

  getAlert(sensorId: number = null): Observable<boolean> {
    if (sensorId != null) {
      const sensor = this.sensors.find(s => s.id === sensorId);
      if (sensor) {
        return of(sensor.alert).pipe(
          delay(environment.delay),
          map(_ => {
            this.authService.updateUserToken('user.session');
            return _;
          })
        );
      }
    } else {
      return of(this.sensors.map(s => s.alert).reduce((a1, a2) => a1 || a2, null)).pipe(
        delay(environment.delay),
        map(_ => {
          this.authService.updateUserToken('user.session');
          return _;
        })
      );
    }

    return of(false).pipe(
      delay(environment.delay),
      map(_ => {
        this.authService.updateUserToken('user.session');
        return _;
      })
    );
  }

  getSensorTypes(): Observable<SensorType[]> {
    return of(this.types).pipe(
      delay(environment.delay),
      map(_ => {
        this.authService.updateUserToken('user.session');
        return _;
      })
    );
  }

  resetReferences() {
    const monitoringService = this.injector.get(MonitoringService);
    monitoringService.resetReferences();
  }

  alertChannel(channelId: number, value: boolean) {
    let sensor;
    if (channelId != null && this.sensors) {
      sensor = this.sensors.find(s => s.channel === channelId);
      this.channels[channelId] = value;
    }

    if (sensor != null) {
      sensor.alert = value;
      setSessionValue('SensorService.sensors', this.sensors);

      const alertState = this.sensors.map(s => s.alert && s.enabled).reduce((a1, a2) => a1 || a2);
      this.eventService.updateSensorsState(alertState);

      if (value && sensor.enabled) {
        const monitoringService = this.injector.get(MonitoringService);
        monitoringService.startAlert(sensor);
      } else if (!value && sensor.enabled) {
        const monitoringService = this.injector.get(MonitoringService);
        monitoringService.stopAlert(sensor);
      }
    }
  }

  reorder(sensors: Sensor[]) {
    this.sensors = sensors;
    setSessionValue('SensorService.sensors', this.sensors);
  }
}
