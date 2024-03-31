import { Inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

import { AuthenticationService } from './authentication.service';

import { Zone } from '@app/models';
import { ZONES } from '@app/demo/configuration';
import { getSessionValue, setSessionValue } from '@app/utils';
import { environment } from '@environments/environment';
import { AUTHENTICATION_SERVICE } from '@app/tokens';


@Injectable()
export class ZoneService {

  zones: Zone[];

  constructor(
    @Inject(AUTHENTICATION_SERVICE) private authService: AuthenticationService
  ) {
    this.zones = getSessionValue('ZoneService.zones', ZONES);
  }

  getZones(): Observable<Zone[]> {
    // send variables by value
    return of(Object.assign([], this.zones))
      .pipe(
        delay(environment.delay),
        map(_ => {
          this.authService.updateUserToken('user.session');
          return _;
        })
      );
  }

  getZone( zoneId: number ): Observable<Zone> {
    // send variables by value
    return of(Object.assign({}, this.zones.filter(zone => zone.id === zoneId)[0]))
      .pipe(
        delay(environment.delay),
        map(_ => {
          this.authService.updateUserToken('user.session');
          return _;
        })
      );
  }

  createZone( zone: Zone ): Observable<Zone> {
    zone.id = Math.max.apply(Math.max, this.zones.map(z => z.id).concat([0])) + 1;
    this.zones.push(zone);
    setSessionValue('ZoneService.zones', this.zones);
    return of(zone);
  }

  updateZone( zone: Zone ): Observable<Zone> {
    const tmpZone = this.zones.find(z => z.id === zone.id);
    const index = this.zones.indexOf(tmpZone);
    this.zones[index] = zone;
    setSessionValue('ZoneService.zones', this.zones);
    return of(zone);
  }

  deleteZone( zoneId: number ): Observable<boolean> {
    this.zones = this.zones.filter(z => z.id !== zoneId);
    setSessionValue('ZoneService.zones', this.zones);
    return of(true);
  }

  getZoneDirectly(zoneId: number) {
    return this.zones.find(z => z.id === zoneId);
  }
}
