
import { map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import 'rxjs/add/operator/delay';

import { Sensor, SensorType } from '../models/index';
import { EventService } from '../services/event.service';
import { environment, SENSORS } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SensorService {

  sensors: Sensor[] = SENSORS;
  types: SensorType[] = [
    {
      id: 0,
      name: 'Motion',
      description: 'Motion sensor',
    },
    {
      id: 1,
      name: 'Break',
      description: 'Break sensor',
    },
    {
      id: 2,
      name: 'Open',
      description: 'Open sensor',
    },
    {
      id: 3,
      name: 'Tamper',
      description: 'Tamper sensor',
    }
  ];

  constructor(
    private http: HttpClient,
    private eventService: EventService
  ) {

  }


  getSensors( onlyAlerting: boolean = false ): Observable<Sensor[]> {
    return of(this.sensors).delay(environment.delay);
  }


  getSensor( sensorId: number ): Observable<Sensor> {
    // get sensors from api
    return this.http.get<Sensor>( '/api/sensor/' + sensorId, { } );
  }


  createSensor( sensor: Sensor ): Observable<Sensor> {
    console.log('Create sensor: ', sensor);
    if (this.sensors.length === 0) {
      sensor.id = 0;
    } else {
      sensor.id = Math.max.apply(Math.max, this.sensors.map(s => s.id)) + 1;
    }

    this.sensors.push(sensor);
    return of(sensor);
  }


  updateSensor( sensor: Sensor ): Observable<Sensor> {
    // set sensor from api
    return this.http.put<Sensor>( '/api/sensor/' + sensor.id, sensor, { } );
  }

  deleteSensor( sensorId: number ): Observable<boolean> {
    // set sensor from api
    return this.http.delete<boolean>( '/api/sensor/' + sensorId, { } );
  }


  getAlert( sensorId: number = null ): Observable<boolean> {
    if ( sensorId ) {
      if (sensorId in this.sensors) {
        return of(this.sensors.filter(sensor => sensor.id === sensorId)[0].alert).delay(environment.delay);
      } else {
        return of(false).delay(environment.delay);
      }
    } else {
      return of(false).delay(environment.delay);
    }
  }


  getSensorTypes(): Observable<SensorType[]> {
    return of(this.types).delay(environment.delay);
  }

  resetReferences() {
    // set sensor from api
    return this.http.put( '/api/sensors/reset-references', null, { } ).pipe(
      map(( response: Response ) => response.json() )).subscribe();
  }

  _alertSensor(sensorId: number, value: boolean) {
    let sensor;
    if (sensorId != null && this.sensors) {
      sensor = this.sensors.find(s => s.id === sensorId);
    }

    if (sensor != null) {
      console.log('Found sensor: ', sensor);
      sensor.alert = value;
      this.eventService._updateSensorsState(sensor.alert);
    }
  }
}


