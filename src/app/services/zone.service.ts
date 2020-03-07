import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';


import { Zone } from '../models';
import { AuthenticationService } from '../services/authentication.service';

@Injectable()
export class ZoneService {

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService
  ) { }

  getZones(): Observable<Zone[]> {
    // get zones from api
    return this.http.get<Zone[]>('/api/zones/');
  }

  getZone( zoneId: number ): Observable<Zone> {
    // get sensors from api
    return this.http.get<Zone>('/api/zone/' + zoneId);
  }

  createZone( zone: Zone ): Observable<Zone> {
    // set sensor from api
    return this.http.post<Zone>('/api/zones/', zone);
  }

  updateZone( zone: Zone ): Observable<Zone> {
    // set sensor from api
    return this.http.put<Zone>('/api/zone/' + zone.id, zone);
  }

  deleteZone( zoneId: number ): Observable<boolean> {
    // set sensor from api
    return this.http.delete<boolean>('/api/zone/' + zoneId);
  }
}
