import { Inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

import { AuthenticationService } from './authentication.service';

import { Area } from 'src/app/models';
import { ZONES } from 'src/app/demo/configuration';
import { getSessionValue, setSessionValue } from 'src/app/utils';
import { environment } from 'src/environments/environment';


@Injectable()
export class AreaService {

  areas: Area[];

  constructor(
    @Inject('AuthenticationService') private authService: AuthenticationService
  ) {
    this.areas = getSessionValue('AreaService.areas', ZONES);
  }

  getAreas(): Observable<Area[]> {
    // send variables by value
    return of(Object.assign([], this.areas))
      .pipe(
        delay(environment.delay),
        map(_ => {
          this.authService.updateUserToken('user.session');
          return _;
        })
      );
  }

  getArea( areaId: number ): Observable<Area> {
    // send variables by value
    return of(Object.assign({}, this.areas.filter(area => area.id === areaId)[0]))
      .pipe(
        delay(environment.delay),
        map(_ => {
          this.authService.updateUserToken('user.session');
          return _;
        })
      );
  }

  createArea( area: Area ): Observable<Area> {
    area.id = Math.max.apply(Math.max, this.areas.map(z => z.id).concat([0])) + 1;
    this.areas.push(area);
    setSessionValue('AreaService.areas', this.areas);
    return of(area);
  }

  updateArea( area: Area ): Observable<Area> {
    const tmpArea = this.areas.find(z => z.id === area.id);
    const index = this.areas.indexOf(tmpArea);
    this.areas[index] = area;
    setSessionValue('AreaService.areas', this.areas);
    return of(area);
  }

  deleteArea( areaId: number ): Observable<boolean> {
    this.areas = this.areas.filter(z => z.id !== areaId);
    setSessionValue('AreaService.areas', this.areas);
    return of(true);
  }

  getAreaDirectly(areaId: number) {
    return this.areas.find(z => z.id === areaId);
  }
}
