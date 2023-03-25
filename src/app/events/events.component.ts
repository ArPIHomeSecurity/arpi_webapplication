import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { forkJoin, merge, Observable, of } from 'rxjs';

import { ALERT_TYPE, ArmEvent, ARM_TYPE, Sensor, User } from '../models';
import { ArmService } from '../services';
import { SensorService, LoaderService, UserService } from '../services';
import { finalize } from 'rxjs/operators';

import { environment } from 'src/environments/environment';

const scheduleMicrotask = Promise.resolve(null);


@Component({
  selector: 'app-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  environment = environment

  armTypes: any = ARM_TYPE;
  alertTypes: any = ALERT_TYPE;

  events: ArmEvent[];
  armsCount: number = 0;
  displayedColumns = ['armType', 'startTime', 'endTime', 'alert'];
  sensors: Sensor[];
  users: User[];

  // filter conditions
  startDate: Date;
  endDate: Date;
  armType: ARM_TYPE = ARM_TYPE.UNDEFINED;
  armedBy: number = 0;
  hasAlert: number = 0;

  constructor(
    @Inject('ArmService') private armService: ArmService,
    @Inject('SensorService') private sensorService: SensorService,
    @Inject('UserService') private userService: UserService,
    @Inject('LoaderService') private loader: LoaderService
  ) { }

  ngOnInit(): void {
    forkJoin({
      arms: this.armService.getArms(this.armType, this.armedBy, this.startDate, this.endDate, this.getAlertsFilter(), 0, 10),
      arms_count: this.armService.getArmsCount(this.armType, this.armedBy, this.startDate, this.endDate, this.getAlertsFilter()),
      sensors: this.sensorService.getSensors(),
      users: this.userService.getUsers()
    })
      .subscribe(results => {
        //this.armHistory = new ArmHistory(of(results.arms), this.paginator);
        this.events = results.arms;
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

    return null
  }

  clearFilters() {
    this.armType = ARM_TYPE.UNDEFINED;
    this.armedBy = 0;
    this.startDate = null;
    this.endDate = null;
    this.hasAlert = 0
  }

  isClearDisabled() {
    return (
      this.armType == ARM_TYPE.UNDEFINED &&
      this.armedBy == 0 &&
      !this.startDate &&
      !this.endDate &&
      this.hasAlert == 0
    )
  }

  filterArms() {
    this.paginator.pageIndex = 0
    this.events = null
    return this.paginate()
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
        //this.armHistory = new ArmHistory(of(results.arms), this.paginator);
        this.events = results.arms;
        this.armsCount = results.arms_count;
      });
  }

  getUsername(user_id: number) {
    return this.users.find(u => u.id == user_id).name;
  }

  getTimeline(event: ArmEvent) {
    let timeline = [];
    if (event.arm) {
      timeline.push({ time: event.arm.time, description: $localize`:@@events armed:Armed`, isDefaultDate: event.arm.time == "2000-01-01 01:00:00"})
    }

    if (event.alert) {
      event.alert.sensors.forEach((sensor) => {
        timeline.push({time: sensor.startTime, description: $localize`:@@events start:Start ${sensor.description}`, isDefaultDate: sensor.startTime == "2000-01-01 01:00:00"})
        if (sensor.endTime) {
          timeline.push({time: sensor.endTime, description: $localize`:@@events end:End ${sensor.description}`, isDefaultDate: sensor.endTime == "2000-01-01 01:00:00"})
        }
      })
      
      timeline.push({time: event.alert.startTime, description: $localize`:@@events alert started:Alert started`, isDefaultDate: event.alert.startTime == "2000-01-01 01:00:00"})
      if (event.alert.endTime) {
        timeline.push({time: event.alert.endTime, description: $localize`:@@events alert finished:Alert finished`, isDefaultDate: event.alert.endTime == "2000-01-01 01:00:00"})
      }
    }

    if (event.disarm) {
      timeline.push({time: event.disarm.time, description: $localize`:@@events disarmed:Disarmed`, isDefaultDate: event.disarm.time == "2000-01-01 01:00:00"})
    }

    timeline.sort((a, b) => a.time > b.time ? 1 : -1);

    return timeline;
  }
}
