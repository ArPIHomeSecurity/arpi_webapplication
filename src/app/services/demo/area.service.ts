import { Inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

import { AuthenticationService } from './authentication.service';
import { EventService } from './event.service';
import { MonitoringService } from './monitoring.service';

import { ARM_TYPE, Area, MONITORING_STATE } from 'src/app/models';
import { AREAS } from 'src/app/demo/configuration';
import { getSessionValue, setSessionValue } from 'src/app/utils';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root',
})
export class AreaService {

  areas: Area[];

  constructor(
    @Inject('AuthenticationService') private authService: AuthenticationService,
    @Inject('EventService') private eventService: EventService,
    @Inject('MonitoringService') private monitoringService: MonitoringService
  ) {
    this.areas = getSessionValue('AreaService.areas', AREAS);
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
    const areas = getSessionValue('AreaService.areas', AREAS);
    return areas.find(z => z.id === areaId);
  }

  arm(areaId: number, armType: ARM_TYPE): Observable<Object> {
    const area = this.areas.find(area => area.id === areaId);
    if (area) {
      area.armState = armType;
      this.eventService.updateAreaState(area);
      setSessionValue('AreaService.areas', this.areas);

      const armState = this.getArmState();
      this.monitoringService.setArm(armState, MONITORING_STATE.ARMED, false);

      return of(area);
    }

    this.monitoringService.setArm(armType, MONITORING_STATE.ARMED, false)
  
    this.areas.forEach(area => {
      if (area.id == areaId) {
        area.armState = armType;
        this.eventService.updateAreaState(area);
        return of(area);
      }
    })
  
    return of(null)
  }

  disarm(areaId: number): Observable<Object> {
    const area = this.areas.find(area => area.id === areaId);
    if (area) {
      area.armState = ARM_TYPE.DISARMED;
      this.eventService.updateAreaState(area);
      setSessionValue('AreaService.areas', this.areas);

      const armState = this.getArmState()
      if (armState === ARM_TYPE.DISARMED) {
        this.monitoringService.disarm(false);
      }
      else {
        this.monitoringService.setArm(armState, MONITORING_STATE.ARMED, false);
      }

      return of(area);
    }

    return of(null);
  }

  updateAreaStates(armType: ARM_TYPE) {
    this.areas.forEach(area => {
      area.armState = armType;
      this.eventService.updateAreaState(area);
    });
    setSessionValue('AreaService.areas', this.areas);
  }

  getArmState(): ARM_TYPE {
    const armStates: ARM_TYPE[] = this.areas.map(area => area.armState)
    const armState = armStates.reduce((armState1, armState2) => {
      if (armState1 === ARM_TYPE.DISARMED) {
        return armState2;
      }
      if (armState2 === ARM_TYPE.DISARMED) {
        return armState1;
      }
      if (armState1 === armState2) {
        return armState1;
      }
      return ARM_TYPE.MIXED;
    });

    return armState;
  }


}
