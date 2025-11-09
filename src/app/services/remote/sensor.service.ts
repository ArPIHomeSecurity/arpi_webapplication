import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Sensor, SensorType } from '@app/models';

@Injectable()
export class SensorService {
  constructor(private http: HttpClient) {}

  getSensors(onlyAlerting = false): Observable<Sensor[]> {
    const params = new HttpParams();
    if (onlyAlerting) {
      params.set('alerting', 'true');
    }

    // get sensors from api
    return this.http.get<Sensor[]>('/api/sensors/', { params });
  }

  getSensor(sensorId: number): Observable<Sensor> {
    // get sensors from api
    return this.http.get<Sensor>('/api/sensor/' + sensorId);
  }

  createSensor(sensor: Sensor): Observable<Sensor> {
    // set sensor from api
    return this.http.post<Sensor>('/api/sensors/', sensor);
  }

  updateSensor(sensor: Sensor): Observable<Sensor> {
    // set sensor from api
    return this.http.put<Sensor>('/api/sensor/' + sensor.id, sensor);
  }

  deleteSensor(sensorId: number): Observable<boolean> {
    // set sensor from api
    return this.http.delete<boolean>('/api/sensor/' + sensorId);
  }

  getAlert(sensorId: number = null): Observable<boolean> {
    // get sensors from api
    if (sensorId) {
      const params: URLSearchParams = new URLSearchParams();
      params.set('sensor_id', sensorId.toString());
      return this.http.get<boolean>('/api/sensor/alert' + sensorId);
    } else {
      return this.http.get<boolean>('/api/sensor/alert');
    }
  }

  getError(sensorId: number = null): Observable<boolean> {
    // get sensors from api
    if (sensorId) {
      const params: URLSearchParams = new URLSearchParams();
      params.set('sensor_id', sensorId.toString());
      return this.http.get<boolean>('/api/sensor/error' + sensorId);
    } else {
      return this.http.get<boolean>('/api/sensor/error');
    }
  }

  getSensorTypes(): Observable<SensorType[]> {
    // get sensor types from api
    return this.http.get<SensorType[]>('/api/sensortypes');
  }

  resetReferences() {
    // set sensor from api
    return this.http.put('/api/sensors/reset-references', null).subscribe();
  }

  resetReference(sensorId) {
    // set sensor from api
    return this.http.put('/api/sensor/' + sensorId + '/reset-reference', null).subscribe();
  }

  reorder(sensors: Sensor[]) {
    return this.http.put('/api/sensor/reorder', sensors).subscribe();
  }
}
