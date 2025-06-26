import { Inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';

import { ConfigurationService } from '@app/services/configuration.service';

import {
  ARM_TYPE,
  Arm,
  ArmEvent,
  Disarm,
  Option,
  SensorsChange,
  SensorState,
  ALERT_TYPE,
  Alert,
  Sensor
} from '@app/models';
import { ARMS, DISARMS, EVENTS } from '@app/demo/configuration';
import { getSessionValue, setSessionValue } from '@app/utils';
import { environment } from '@environments/environment';
import { AUTHENTICATION_SERVICE } from '@app/tokens';
import { ZoneService } from './zone.service';
import { SensorService } from './sensor.service';
import { AuthenticationService } from './authentication.service';
import { AreaService } from './area.service';

@Injectable({
  providedIn: 'root'
})
export class ArmService {
  constructor(
    @Inject('AreaService') private areaService: AreaService,
    @Inject(AUTHENTICATION_SERVICE) private authService: AuthenticationService,
    @Inject('ConfigurationService') private configurationService: ConfigurationService,
    @Inject('SensorService') private sensorService: SensorService,
    @Inject('ZoneService') private zoneService: ZoneService
  ) {}

  getArms(
    armType: ARM_TYPE,
    userId: number,
    startDate: Date,
    endDate: Date,
    hasAlert: boolean
  ): Observable<ArmEvent[]> {
    const events: ArmEvent[] = getSessionValue('ArmService.events', EVENTS);
    const filteredEvents = events
      .filter(event =>
        armType != ARM_TYPE.UNDEFINED
          ? (event.arm?.type == null && armType == ARM_TYPE.DISARMED) || event.arm?.type === armType
          : true
      )
      .filter(event => (userId != 0 ? event.arm?.userId === userId || event.disarm?.userId === userId : true))
      .filter(event => (startDate != undefined ? new Date(event.arm?.time) >= startDate : true))
      .filter(event => (endDate != undefined ? new Date(event.arm?.time) <= endDate : true))
      .filter(event => hasAlert == null || (event.alert != null && hasAlert) || (event.alert == null && !hasAlert));

    const sortedEvents = filteredEvents.sort((a1, a2) => {
      // ongoing alert to the top
      if (a1.disarm == null) {
        return -1;
      }
      if (a2.disarm == null) {
        return 1;
      }

      const a1time = a1.arm?.time ? a1.arm?.time : a1.disarm?.time;
      const a2time = a2.arm?.time ? a2.arm?.time : a2.disarm?.time;

      if (a1time < a2time) {
        return 1;
      }
      if (a1time > a2time) {
        return -1;
      }
      return 0;
    });
    return of(sortedEvents).pipe(
      delay(environment.delay),
      map(_ => {
        this.authService.updateUserToken('user.session');
        return _;
      })
    );
  }

  getArmsCount(
    armType: ARM_TYPE,
    userId: number,
    startDate: Date,
    endDate: Date,
    hasAlert: boolean
  ): Observable<number> {
    const events: ArmEvent[] = getSessionValue('ArmService.events', EVENTS);
    const filteredEvents = events
      .filter(event =>
        armType != ARM_TYPE.UNDEFINED
          ? (event.arm?.type == null && armType == ARM_TYPE.DISARMED) || event.arm?.type === armType
          : true
      )
      .filter(event => (userId != 0 ? event.arm?.userId === userId || event.disarm?.userId === userId : true))
      .filter(event => (startDate != undefined ? new Date(event.arm?.time) >= startDate : true))
      .filter(event => (endDate != undefined ? new Date(event.arm?.time) <= endDate : true))
      .filter(event => hasAlert == null || (event.alert != null && hasAlert) || (event.alert == null && !hasAlert));
    const count = filteredEvents.length;
    return of(count).pipe(
      delay(environment.delay),
      map(_ => {
        this.authService.updateUserToken('user.session');
        return _;
      })
    );
  }

  startArm(armType: ARM_TYPE, userId: number) {
    // find current event
    const events = getSessionValue('ArmService.events', EVENTS);
    let event: ArmEvent = events.find(event => event.disarm === null);
    if (!event) {
      const arm: Arm = {
        id: events.length + 1,
        time: new Date().toISOString().split('.')[0].replace('T', ' '),
        type: armType,
        userId: userId,
        keypadId: null,
        alert: null
      };

      event = {
        arm: arm,
        disarm: null,
        alert: null,
        sensorChanges: []
      };

      events.push(event);
    }

    if (event.arm != null) {
      event.arm.type = armType;
    }

    const sensorsChange: SensorsChange = {
      timestamp: new Date().toISOString().split('.')[0].replace('T', ' '),
      sensors: []
    };

    this.sensorService.sensors.forEach(sensor => {
      const getDelay = (armType: ARM_TYPE, zoneId: number) => {
        if (armType === ARM_TYPE.AWAY) {
          return this.zoneService.zones.find(z => z.id === zoneId).awayAlertDelay;
        }
        if (armType === ARM_TYPE.STAY) {
          return this.zoneService.zones.find(z => z.id === zoneId).stayAlertDelay;
        }
        if (armType === ARM_TYPE.DISARMED) {
          return this.zoneService.zones.find(z => z.id === zoneId).disarmedDelay;
        }
      };

      const sensorState: SensorState = {
        sensor_id: sensor.id,
        channel: sensor.channel,
        type_id: sensor.typeId,
        description: sensor.description,
        timestamp: new Date().toISOString().split('.')[0].replace('T', ' '),
        delay: getDelay(this.areaService.getAreaDirectly(sensor.areaId).armState, sensor.zoneId),
        enabled: sensor.enabled
      };
      sensorsChange.sensors.push(sensorState);
    });

    event.sensorChanges.push(sensorsChange);

    setSessionValue('ArmService.events', events);
  }

  stopArm(userId: number) {
    const events = getSessionValue('ArmService.events', EVENTS);
    const currentEvent = events.find(event => event.disarm === null);

    if (!currentEvent) {
      const currentEvent: ArmEvent = {
        arm: null,
        disarm: null,
        alert: null,
        sensorChanges: []
      };

      events.push(currentEvent);
    }

    const disarm: Disarm = {
      id: events.length + 1,
      time: new Date().toISOString().split('.')[0].replace('T', ' '),
      userId: userId,
      keypadId: null,
      arm: currentEvent.arm
    };

    // stop alert
    if (currentEvent.alert != null) {
      currentEvent.alert.endTime = new Date().toISOString().split('.')[0].replace('T', ' ');
    }

    currentEvent.disarm = disarm;
    setSessionValue('ArmService.events', events);
  }

  startAlert(alert: Alert) {
    const events = getSessionValue('ArmService.events', EVENTS);
    let currentEvent: ArmEvent = events.find(event => event.disarm === null);

    if (!currentEvent) {
      currentEvent = {
        arm: null,
        disarm: null,
        alert: alert,
        sensorChanges: []
      };

      events.push(currentEvent);
    }

    currentEvent.alert = alert;
    setSessionValue('ArmService.events', events);
  }

  stopAlert(sensor: Sensor) {
    const events = getSessionValue('ArmService.events', EVENTS);
    const currentEvent: ArmEvent = events.find(event => event.disarm === null);

    if (currentEvent) {
      const alert = currentEvent.alert;
      if (alert) {
        alert.sensors.find(s => s.sensorId === sensor.id).endTime = new Date()
          .toISOString()
          .split('.')[0]
          .replace('T', ' ');
      }
      setSessionValue('ArmService.events', events);
    }
  }

  startSabogate() {
    const events = getSessionValue('ArmService.events', EVENTS);
    const currentEvent: ArmEvent = {
      arm: null,
      disarm: null,
      alert: null,
      sensorChanges: []
    };
    events.push(currentEvent);

    if (currentEvent) {
      currentEvent.alert = {
        id: events.length + 1,
        startTime: new Date().toISOString().split('.')[0].replace('T', ' '),
        endTime: null,
        alertType: ALERT_TYPE.SABOTAGE,
        silent: false,
        sensors: []
      };
      setSessionValue('ArmService.events', events);
    }
  }
}
