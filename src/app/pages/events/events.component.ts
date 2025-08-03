import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { forkJoin } from 'rxjs';

import { ALERT_TYPE, ArmEvent, SensorState, SensorsChange, ARM_TYPE, Sensor, User } from '@app/models';
import { ArmService } from '@app/services';
import { SensorService, LoaderService, UserService } from '@app/services';
import { finalize } from 'rxjs/operators';

import { environment } from '@environments/environment';

const scheduleMicrotask = Promise.resolve(null);

@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss'],
  standalone: false
})
export class EventsComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  environment = environment;

  armTypes: any = ARM_TYPE;
  alertTypes: any = ALERT_TYPE;

  events: ArmEvent[];
  armsCount = 0;
  displayedColumns = ['armType', 'startTime', 'endTime', 'alert'];
  sensors: Sensor[];
  users: User[];

  // filter conditions
  startDate: Date;
  endDate: Date;
  armType: ARM_TYPE = ARM_TYPE.UNDEFINED;
  armedBy = 0;
  hasAlert = 0;

  constructor(
    @Inject('ArmService') private armService: ArmService,
    @Inject('SensorService') private sensorService: SensorService,
    @Inject('UserService') private userService: UserService,
    @Inject('LoaderService') private loader: LoaderService
  ) {}

  ngOnInit(): void {
    forkJoin({
      arms: this.armService.getArms(
        this.armType,
        this.armedBy,
        this.startDate,
        this.endDate,
        this.getAlertsFilter(),
        0,
        10
      ),
      arms_count: this.armService.getArmsCount(
        this.armType,
        this.armedBy,
        this.startDate,
        this.endDate,
        this.getAlertsFilter()
      ),
      sensors: this.sensorService.getSensors(),
      users: this.userService.getUsers()
    }).subscribe(results => {
      this.events = results.arms;
      this.sortArms();
      this.armsCount = results.arms_count;
      this.sensors = results.sensors;
      this.users = results.users;
    });
  }

  getAlertsFilter() {
    if (this.hasAlert == 2) {
      return true;
    }
    if (this.hasAlert == 1) {
      return false;
    }

    return null;
  }

  clearFilters() {
    this.armType = ARM_TYPE.UNDEFINED;
    this.armedBy = 0;
    this.startDate = null;
    this.endDate = null;
    this.hasAlert = 0;
  }

  isClearDisabled() {
    return (
      this.armType == ARM_TYPE.UNDEFINED && this.armedBy == 0 && !this.startDate && !this.endDate && this.hasAlert == 0
    );
  }

  filterArms() {
    this.paginator.pageIndex = 0;
    this.events = null;
    return this.paginate();
  }

  sortArms() {
    this.events = this.events.map((event: ArmEvent) => {
      if (event.sensorChanges) {
        event.sensorChanges = event.sensorChanges.map((sensorChange: SensorsChange) => {
          sensorChange.sensors.sort((s1, s2) => (s1.channel < s2.channel ? -1 : 1));
          return sensorChange;
        });
      }
      return event;
    });
  }

  paginate() {
    forkJoin({
      arms: this.armService.getArms(
        this.armType,
        this.armedBy,
        this.startDate,
        this.endDate,
        this.getAlertsFilter(),
        this.paginator.pageIndex * this.paginator.pageSize,
        this.paginator.pageSize
      ),
      arms_count: this.armService.getArmsCount(
        this.armType,
        this.armedBy,
        this.startDate,
        this.endDate,
        this.getAlertsFilter()
      )
    })
      .pipe(finalize(() => this.loader.display(false)))
      .subscribe(results => {
        this.events = results.arms;
        this.sortArms();
        this.armsCount = results.arms_count;
      });
  }

  getUsername(user_id: number) {
    if (this.users) {
      const user = this.users.find(u => u.id == user_id);
      if (user) {
        return user.name;
      }
    }

    return '-';
  }

  getTimeline(event: ArmEvent) {
    const timeline = [];
    if (event.arm) {
      timeline.push({
        time: event.arm.time,
        description: $localize`:@@events armed:Armed`,
        isDefaultDate: event.arm.time == '2000-01-01 01:00:00'
      });
    }

    if (event.sensorChanges && event.sensorChanges.length > 1) {
      event.sensorChanges.map(armSensor =>
        timeline.push({
          time: armSensor.timestamp,
          description: $localize`:@@events arm changed:Arm changed`,
          isDefaultDate: armSensor.timestamp == '2000-01-01 01:00:00'
        })
      );
    }

    if (event.alert) {
      event.alert.sensors.forEach(sensor => {
        const silent = sensor.silent ? $localize`:@@events timeline silent:(silent)` : '';
        timeline.push({
          time: sensor.startTime,
          description: $localize`:@@events start:Start ${sensor.name} ${silent}`,
          isDefaultDate: sensor.startTime == '2000-01-01 01:00:00'
        });
        if (sensor.endTime) {
          timeline.push({
            time: sensor.endTime,
            description: $localize`:@@events end:End ${sensor.name}`,
            isDefaultDate: sensor.endTime == '2000-01-01 01:00:00'
          });
        }
      });

      timeline.push({
        time: event.alert.startTime,
        description: $localize`:@@events alert started:Alert started`,
        isDefaultDate: event.alert.startTime == '2000-01-01 01:00:00'
      });
      if (event.alert.endTime) {
        timeline.push({
          time: event.alert.endTime,
          description: $localize`:@@events alert finished:Alert finished`,
          isDefaultDate: event.alert.endTime == '2000-01-01 01:00:00'
        });
      }
    }

    if (event.disarm) {
      timeline.push({
        time: event.disarm.time,
        description: $localize`:@@events disarmed:Disarmed`,
        isDefaultDate: event.disarm.time == '2000-01-01 01:00:00'
      });
    }

    timeline.sort((a, b) => (a.time > b.time ? 1 : -1));

    return timeline;
  }

  getEventTimestamps(event: ArmEvent) {
    return event.sensorChanges.map(a => a.timestamp);
  }

  getEventSensorRange(event: ArmEvent): number[] {
    return Array(event.sensorChanges[0].sensors.length)
      .fill(0)
      .map((x, i) => i);
  }

  getEventSensorStates(event: ArmEvent, sensorIndex: number): SensorState[] | [] {
    return event.sensorChanges
      .map(a => {
        if (a.sensors.length <= sensorIndex) {
          return null;
        }
        return a.sensors[sensorIndex];
      })
      .filter(sensorState => sensorState !== null) as SensorState[];
  }
}
