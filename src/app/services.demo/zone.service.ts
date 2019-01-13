import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';

import { Zone } from '../models/index';

import { environment, ZONES } from '../../environments/environment';

@Injectable()
export class ZoneService {

  zones: Zone[] = ZONES;

  constructor(
    private http: HttpClient
  ) { }

  getZones(): Observable<Zone[]> {
    return of(this.zones);
  }

  getZone( zoneId: number ): Observable<Zone> {
    return of(this.zones.filter(zone => zone.id === zoneId)[0]).delay(environment.delay);
  }

  createZone( zone: Zone ): Observable<Zone> {
    console.log('Create zone: ', zone);
    if (this.zones.length === 0) {
      zone.id = 0;
    } else {
      zone.id = Math.max.apply(Math.max, this.zones.map(z => z.id)) + 1;
    }

    this.zones.push(zone);
    return of(zone);
  }

  updateZone( zone: Zone ): Observable<Zone> {
    // set sensor from api
    return this.http.put<Zone>( '/api/zone/' + zone.id, zone, { } );
  }

  deleteZone( zoneId: number ): Observable<boolean> {
    // set sensor from api
    return this.http.delete<boolean>( '/api/zone/' + zoneId, { } );
  }
}
