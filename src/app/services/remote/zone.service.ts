import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Zone } from '@app/models';


@Injectable()
export class ZoneService {

  constructor(
    private http: HttpClient
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
    return this.http.post<Zone>('/api/zones/', zone);
  }

  updateZone( zone: Zone ): Observable<Zone> {
    return this.http.put<Zone>('/api/zone/' + zone.id, zone);
  }

  deleteZone( zoneId: number ): Observable<boolean> {
    return this.http.delete<boolean>('/api/zone/' + zoneId);
  }

  reorder(zones: Zone[]) {
    return this.http.put<Zone[]>('/api/zones/reorder', zones).subscribe();
  }
}
