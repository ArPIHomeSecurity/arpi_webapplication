import { Inject, Injectable, Injector } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';

import { AuthenticationService } from './authentication.service';
import { ArmService } from './arm.service';
import { ConfigurationService } from '../configuration.service';
import { EventService } from './event.service';

import { ALERT_TYPE, Alert, Sensor, AlertSensor, Option } from 'src/app/models';
import { ALERTS } from 'src/app/demo/configuration';
import { getSessionValue, getValue, setSessionValue } from 'src/app/utils';
import { environment } from 'src/environments/environment';


@Injectable()
export class AlertService {

  alerts: Alert[];

  // true=syren / false=syren muted / null=no syren
  syrenConfig: Option;
  alertIsRunning: boolean;
  syrenIsOn: boolean;

  constructor(
    @Inject('AuthenticationService') private authService: AuthenticationService,
    @Inject('ConfigurationService') private configurationService: ConfigurationService,
    @Inject('EventService') private eventService: EventService,

    // resolving circular dependency with AreaService, ArmService
    private injector: Injector
  ) {
    this.alerts = getSessionValue('AlertService.alerts', ALERTS);
    this.alertIsRunning = getSessionValue('AlertService.alertIsRunning', false);
    this.syrenIsOn = getSessionValue('AlertService.syrenIsOn', false);

    this.configurationService.getOption('alert', 'syren')
      .subscribe(config => {
        this.syrenConfig = config;
        if (this.alertIsRunning) {
          this.startSyren();
        }
      });
  }

  getAlerts(): Observable<Alert[]> {
    const sortedAlerts = this.alerts.sort((a1, a2) => {
      if (a1.startTime < a2.startTime) {
        return 1;
      }
      if (a1.startTime > a2.startTime) {
        return -1;
      }
      return 0;
    });
    return of(sortedAlerts)
      .pipe(
        delay(environment.delay),
        map(_ => {
          this.authService.updateUserToken('user.session');
          return _;
        })
      );
  }


  getAlert(): Observable<Alert> {
    // get sensors from api
    return of(this.alerts.find(a => a.endTime === null)).pipe(delay(environment.delay));
  }

  createAlert(sensors: Sensor[], alertType: ALERT_TYPE) {
    const alertSensors: AlertSensor[] = [];
    
    let currentAlert: Alert = this.alerts.find(a => a.endTime == null);
    if (!currentAlert) {
      currentAlert = {
        id: this.alerts.length + 1,
        startTime: new Date().toISOString().split(".")[0].replace("T", " "),
        endTime: null,
        alertType,
        silent: false,
        sensors: alertSensors
      };
    }
    
    sensors.forEach(sensor => {
      if (currentAlert.sensors.find(s => s.sensorId === sensor.id) == null) {
        currentAlert.sensors.push({
          sensorId: sensor.id,
          typeId: sensor.typeId,
          channel: sensor.channel,
          description: sensor.description,
          startTime: new Date().toISOString().split(".")[0].replace("T", " "),
          endTime: null,
          delay: 0
        });
      }
    });

    const armService = this.injector.get(ArmService);
    armService.startAlert(currentAlert);

    this.alerts.push(currentAlert);
    this.syrenIsOn = true;
    setSessionValue('AlertService.alerts', this.alerts);
    setSessionValue('AlertService.syren', this.syrenIsOn);
    this.eventService.updateAlertState(currentAlert);
    this.eventService.updateSyrenState(this.syrenIsOn);

    this.alertIsRunning = true;
    setSessionValue('AlertService.alertIsRunning', this.alertIsRunning);
    this.startSyren();
  }

  startSyren() {
    // start syren
    this.syrenIsOn = true;
    setSessionValue('AlertService.syrenIsOn', this.syrenIsOn);
    this.eventService.updateSyrenState(this.syrenIsOn);

    // suspend syren
    setTimeout(() => {
        // restart the loop if alert is running
        if (this.alertIsRunning) {
          this.syrenIsOn = false;
          this.eventService.updateSyrenState(this.syrenIsOn);
          setSessionValue('AlertService.syrenId', this.syrenIsOn);

          // restart syren loop
          setTimeout(() => {
              // restart the loop if alert is running
              if (this.alertIsRunning) {
                this.startSyren();
              }
            },
            getValue(this.syrenConfig.value, 'suspend_time', 300000) * 1000 // s => ms
          );
        }
      },
      getValue(this.syrenConfig.value, 'alert_time', 600000) * 1000 // s => ms
    );
  }

  stopAlert() {
    const alert = this.alerts.find(a => a.endTime == null);
    if (alert != null) {
      alert.endTime = new Date().toISOString().split(".")[0].replace("T", " ");
      this.alertIsRunning = false;
      this.syrenIsOn = null;
      setSessionValue('AlertService.alerts', this.alerts);
      setSessionValue('AlertService.syren', this.syrenIsOn);
      setSessionValue('AlertService.alertIsRunning', this.alertIsRunning);
      this.eventService.updateAlertState(null);
      this.eventService.updateSyrenState(this.syrenIsOn);
    }
  }
}
