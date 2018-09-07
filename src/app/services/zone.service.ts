import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { Zone } from '../models/index';
import { AuthenticationService } from '../services/authentication.service';

@Injectable()
export class ZoneService {

  constructor(
      private http: Http,
      private authService: AuthenticationService
  ) { }

  getZones(): Observable<Zone[]> {
    // add authorization header with jwt token
    const token = this.authService.getToken();
    const headers = new Headers({'Authorization': 'Bearer ' + token});
    const options = new RequestOptions({headers: headers});

    // get zones from api
    return this.http.get('/api/zones/', options)
      .map((response: Response) => response.json());
  }

  getZone(zoneId: number): Observable<Zone> {
    // add authorization header with jwt token
    const token = this.authService.getToken();
    const headers = new Headers({'Authorization': 'Bearer ' + token});
    const options = new RequestOptions({headers: headers});

    // get sensors from api
    return this.http.get('/api/zone/' + zoneId, options)
      .map((response: Response) => response.json());
  }

  createZone(zone: Zone): Observable<Zone> {
    // add authorization header with jwt token
    const token = this.authService.getToken();
    const headers = new Headers({'Authorization': 'Bearer ' + token});
    const options = new RequestOptions({headers: headers});

    // set sensor from api
    console.log('Service new zone POST');
    return this.http.post('/api/zones/', zone, options)
      .map((response: Response) => response.json());
    }

  updateZone(zone: Zone): Observable<Zone> {
    // add authorization header with jwt token
    const token = this.authService.getToken();
    const headers = new Headers({'Authorization': 'Bearer ' + token});
    const options = new RequestOptions({headers: headers});

    // set sensor from api
    return this.http.put('/api/zone/' + zone.id, zone, options)
      .map((response: Response) => response.json());
  }
  
  deleteZone(zoneId: number): Observable<Zone> {
    // add authorization header with jwt token
    const token = this.authService.getToken();
    const headers = new Headers({'Authorization': 'Bearer ' + token});
    const options = new RequestOptions({headers: headers});

    // set sensor from api
    return this.http.delete('/api/zone/' + zoneId, options)
      .map((response: Response) => response.json());
  }
}
