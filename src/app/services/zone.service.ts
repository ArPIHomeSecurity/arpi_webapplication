import { Observable } from 'rxjs';

import { Zone } from '../models';


export interface ZoneService {

  getZones(): Observable<Zone[]>;

  getZone( zoneId: number ): Observable<Zone>;

  createZone( zone: Zone ): Observable<Zone>;

  updateZone( zone: Zone ): Observable<Zone>;

  deleteZone( zoneId: number ): Observable<boolean>;

  reorder(zones: Zone[]);
}
