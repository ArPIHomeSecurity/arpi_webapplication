import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response, URLSearchParams } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { Sensor, SensorType } from '../models/index';
import { AuthenticationService } from '../services/authentication.service';

@Injectable()
export class SensorService {
  constructor(
      private http: Http,
      private authService: AuthenticationService
  ) { }


  getSensors(onlyAlerting: boolean = false): Observable<Sensor[]> {
    // add authorization header with jwt token
    const token = this.authService.getToken();
    const headers = new Headers({'Authorization': 'Bearer ' + token});

    const params: URLSearchParams = new URLSearchParams();
    if (onlyAlerting) {
      params.set('alerting', 'true');
    }

    const options = new RequestOptions({headers: headers, params: params});

    // get sensors from api
    return this.http.get('/api/sensors/', options)
      .map((response: Response) => response.json());
  }


  getSensor(sensorId: number): Observable<Sensor> {
    // add authorization header with jwt token
    const token = this.authService.getToken();
    const headers = new Headers({'Authorization': 'Bearer ' + token});
    const options = new RequestOptions({headers: headers});

    // get sensors from api
    return this.http.get('/api/sensor/' + sensorId, options)
      .map((response: Response) => response.json());
  }


  createSensor(sensor: Sensor): Observable<Sensor> {
    // add authorization header with jwt token
    const token = this.authService.getToken();
    const headers = new Headers({'Authorization': 'Bearer ' + token});
    const options = new RequestOptions({headers: headers});

    // set sensor from api
    return this.http.post('/api/sensors/', sensor, options)
      .map((response: Response) => response.json());
  }


  updateSensor(sensor: Sensor): Observable<Sensor> {
    // add authorization header with jwt token
    const token = this.authService.getToken();
    const headers = new Headers({'Authorization': 'Bearer ' + token});
    const options = new RequestOptions({headers: headers});

    // set sensor from api
    return this.http.put('/api/sensor/' + sensor.id, sensor, options)
      .map((response: Response) => response.json());
  }
  
  deleteSensor(sensorId: number): Observable<Sensor> {
    // add authorization header with jwt token
    const token = this.authService.getToken();
    const headers = new Headers({'Authorization': 'Bearer ' + token});
    const options = new RequestOptions({headers: headers});

    // set sensor from api
    return this.http.delete('/api/sensor/' + sensorId, options)
      .map((response: Response) => response.json());
  }


  getAlert(sensorId: number = null): Observable<boolean> {
    // add authorization header with jwt token
    const token = this.authService.getToken();
    const headers = new Headers({'Authorization': 'Bearer ' + token});
    const options = new RequestOptions({headers: headers});

    // get sensors from api
    if (sensorId) {
      const params: URLSearchParams = new URLSearchParams();
      params.set('sensor_id', sensorId.toString());
      return this.http.get('/api/sensor/getAlert' + sensorId, options)
        .map((response: Response) => response.json());
    }
    else {
      return this.http.get('/api/sensor/getAlert', options)
      .map((response: Response) => response.json());
    }
  }


  getSensorTypes(): Observable<SensorType[]> {
    // add authorization header with jwt token
    const token = this.authService.getToken();
    const headers = new Headers({'Authorization': 'Bearer ' + token});

    const options = new RequestOptions({headers: headers});

    // get sensor types from api
    return this.http.get('/api/sensortypes', options)
      .map((response: Response) => response.json());
  }

  resetReferences() {
    // add authorization header with jwt token
    const token = this.authService.getToken();
    const headers = new Headers({'Authorization': 'Bearer ' + token});
    const options = new RequestOptions({headers: headers});

    // set sensor from api
    return this.http.put('/api/sensors/reset-references', null, options)
      .map((response: Response) => response.json()).subscribe();
  }
}


