import { Inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';

import { AuthenticationService } from './authentication.service';
import { EventService } from './event.service';

import { Arm, Option } from 'src/app/models';
import { ALERTS } from 'src/app/demo/configuration';
import { getSessionValue } from 'src/app/utils';
import { environment } from 'src/environments/environment';
import { ConfigurationService } from '../configuration.service';


@Injectable()
export class ArmService {

  arms: Arm[];

  // true=syren / false=syren muted / null=no syren
  syrenConfig: Option;
  armIsRunning: boolean;
  syrenIsOn: boolean;

  constructor(
    @Inject('AuthenticationService') private authService: AuthenticationService,
    @Inject('ConfigurationService') private configurationService: ConfigurationService,
    @Inject('EventService') private eventService: EventService
  ) {
    this.arms = getSessionValue('ArmService.arms', ALERTS);
    this.armIsRunning = getSessionValue('ArmService.armIsRunning', false);
    this.syrenIsOn = getSessionValue('ArmService.syrenIsOn', false);

    this.configurationService.getOption('arm', 'syren')
      .subscribe(config => {
        this.syrenConfig = config;
        if (this.armIsRunning) {
          //this.startSyren();
        }
      });
  }

  getArms(): Observable<Arm[]> {
    const sortedArms = this.arms.sort((a1, a2) => {
      if (a1.time < a2.time) {
        return 1;
      }
      if (a1.time > a2.time) {
        return -1;
      }
      return 0;
    });
    return of(sortedArms)
      .pipe(
        delay(environment.delay),
        map(_ => {
          this.authService.updateUserToken('user.session');
          return _;
        })
      );
  }


  getArm(): Observable<Arm> {
    // get sensors from api
    // FIXME: this is a hacky way to get the arm
    return of(this.arms.find(a => a.time === null)).pipe(delay(environment.delay));
  }
}
