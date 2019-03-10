
import {map} from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';


import { Sensor, SensorType } from '../models/index';
import { AuthenticationService } from '../services/authentication.service';

@Injectable()
export class SensorService {
  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) { }


  getSensors( onlyAlerting: boolean = false ): Observable<Sensor[]> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    const params = new HttpParams();
    if ( onlyAlerting ) {
      params.set( 'alerting', 'true' );
    }

    // get sensors from api
    return this.http.get<Sensor[]>( '/api/sensors/', { headers, params } );
  }


  getSensor( sensorId: number ): Observable<Sensor> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    // get sensors from api
    return this.http.get<Sensor>( '/api/sensor/' + sensorId, { headers } );
  }


  createSensor( sensor: Sensor ): Observable<Sensor> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    // set sensor from api
    return this.http.post<Sensor>( '/api/sensors/', sensor, { headers } );
  }


  updateSensor( sensor: Sensor ): Observable<Sensor> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    // set sensor from api
    return this.http.put<Sensor>( '/api/sensor/' + sensor.id, sensor, { headers } );
  }

  deleteSensor( sensorId: number ): Observable<boolean> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    // set sensor from api
    return this.http.delete<boolean>( '/api/sensor/' + sensorId, { headers } );
  }


  getAlert( sensorId: number = null ): Observable<boolean> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    // get sensors from api
    if ( sensorId ) {
      const params: URLSearchParams = new URLSearchParams();
      params.set( 'sensor_id', sensorId.toString() );
      return this.http.get<boolean>( '/api/sensor/alert' + sensorId, { headers } );
    } else {
      return this.http.get<boolean>( '/api/sensor/alert', { headers } );
    }
  }


  getSensorTypes(): Observable<SensorType[]> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    // get sensor types from api
    return this.http.get<SensorType[]>( '/api/sensortypes', { headers } );
  }

  resetReferences() {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    // set sensor from api
    return this.http.put( '/api/sensors/reset-references', null, { headers } ).subscribe();
  }
}


