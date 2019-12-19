import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

import { Sensor, SensorType } from '../models';
import { EventService } from '../services/event.service';
import { MonitoringService } from './monitoring.service';
import { environment, SENSORS, SENSOR_TYPES } from '../../environments/environment';
import { getSessionValue, setSessionValue } from '../utils';

@Injectable({
  providedIn: 'root',
})
export class SensorService {

  sensors: Sensor[];
  types: SensorType[] = SENSOR_TYPES;
  channels: boolean[] = [];

  constructor(
    private eventService: EventService,
    private monitoringService: MonitoringService
  ) {
    // channels are numbered 1..N
    for (let i = 0; i < environment.channel_count; i++) {
      this.channels.push(false);
    }

    this.sensors = getSessionValue('SensorService.sensors', SENSORS);
  }


  getSensors( onlyAlerting: boolean = false ): Observable<Sensor[]> {
    // send variables by value
    return of(Object.assign([], this.sensors)).pipe(delay(environment.delay));
  }


  getSensor( sensorId: number ): Observable<Sensor> {
    // send variables by value
    return of(Object.assign({}, this.sensors.find(s => s.id === sensorId)));
  }


  createSensor( sensor: Sensor ): Observable<Sensor> {
    sensor.id = Math.max.apply(Math.max, this.sensors.map(s => s.id).concat([0])) + 1;
    sensor.alert = sensor.channel === -1 ? false : this.channels[sensor.channel];
    this.sensors.push(sensor);
    setSessionValue('SensorService.sensors', this.sensors);

    const alertState = this.sensors.map(s => s.alert && s.enabled).reduce((a1, a2) => a1 || a2, false);
    this.eventService._updateSensorsState(alertState);
    return of(sensor);
  }


  updateSensor( sensor: Sensor ): Observable<Sensor> {
    const tmpSensor = this.sensors.find(s => s.id === sensor.id);
    const index = this.sensors.indexOf(tmpSensor);
    sensor.alert = sensor.channel === -1 ? false : this.channels[sensor.channel];
    this.sensors[index] = sensor;
    setSessionValue('SensorService.sensors', this.sensors);

    const alertState = this.sensors.map(s => s.alert && s.enabled).reduce((a1, a2) => a1 || a2, false);
    this.eventService._updateSensorsState(alertState);
    return of(sensor);
  }

  deleteSensor( sensorId: number ): Observable<boolean> {
    this.sensors = this.sensors.filter(s => s.id !== sensorId);
    setSessionValue('SensorService.sensors', this.sensors);

    const alertState = this.sensors.map(s => s.alert && s.enabled).reduce((a1, a2) => a1 || a2, false);
    this.eventService._updateSensorsState(alertState);
    return of(true);
  }


  getAlert( sensorId: number = null ): Observable<boolean> {
    if (sensorId != null) {
      const sensor = this.sensors.find(sensor => sensor.id === sensorId);
      if (sensor) {
        return of(sensor.alert).pipe(delay(environment.delay));
      }
    } else {
      return of(this.sensors.map(s => s.alert).reduce((a1, a2) => a1 || a2)).pipe(delay(environment.delay));
    }

    return of(false).pipe(delay(environment.delay));
  }


  getSensorTypes(): Observable<SensorType[]> {
    return of(this.types).pipe(delay(environment.delay));
  }

  resetReferences() {
    this.monitoringService._resetReferences();
  }

  _alertChannel(channelId: number, value: boolean) {
    let sensor;
    if (channelId != null && this.sensors) {
      sensor = this.sensors.find(s => s.channel === channelId);
      this.channels[channelId] = value;
    }

    if (sensor != null) {
      sensor.alert = value;
      setSessionValue('SensorService.sensors', this.sensors);

      const alertState = this.sensors.map(s => s.alert && s.enabled).reduce((a1, a2) => a1 || a2);
      this.eventService._updateSensorsState(alertState);

      if (value && sensor.enabled) {
        this.monitoringService._onAlert(sensor);
      }
    }
  }
}


