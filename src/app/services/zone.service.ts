import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { Zone } from '../models/index';
import { AuthenticationService } from '../services/authentication.service';

@Injectable()
export class ZoneService {

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) { }

  getZones(): Observable<Zone[]> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    // get zones from api
    return this.http.get<Zone[]>( '/api/zones/', { headers } );
  }

  getZone( zoneId: number ): Observable<Zone> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    // get sensors from api
    return this.http.get<Zone>( '/api/zone/' + zoneId, { headers } );
  }

  createZone( zone: Zone ): Observable<Zone> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    // set sensor from api
    return this.http.post<Zone>( '/api/zones/', zone, { headers } );
  }

  updateZone( zone: Zone ): Observable<Zone> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    // set sensor from api
    return this.http.put<Zone>( '/api/zone/' + zone.id, zone, { headers } );
  }

  deleteZone( zoneId: number ): Observable<boolean> {
    // add authorization header with jwt token
    const headers = new HttpHeaders( { 'Authorization': 'Bearer ' + this.authService.getToken() } );

    // set sensor from api
    return this.http.delete<boolean>( '/api/zone/' + zoneId, { headers } );
  }
}
