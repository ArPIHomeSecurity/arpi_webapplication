import { Component, Inject, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Alert, ARM_TYPE, MONITORING_STATE, string2ArmType, string2MonitoringState, SensorType, Sensor, Zone, Area } from '../models';
import { AlertService, AreaService, EventService, LoaderService, MonitoringService, SensorService, ZoneService } from '../services';

import { environment } from '../../environments/environment';
import { forkJoin } from 'rxjs';


@Component({
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.scss'],
  providers: []
})

export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('snackbarTemplate') snackbarTemplate: TemplateRef<any>;
  action: string;

  alert: Alert;
  armTypes: any = ARM_TYPE;
  armState: ARM_TYPE = ARM_TYPE.UNDEFINED;
  monitoringStates: any = MONITORING_STATE;
  monitoringState: MONITORING_STATE;
  sensorAlert: boolean;
  sensors: Sensor[];
  sensorTypes: SensorType [] = [];
  zones: Zone[] = [];
  areas: Area[] = [];

  constructor(
    @Inject('AlertService') private alertService: AlertService,
    @Inject('AreaService') private areaService: AreaService,
    @Inject('EventService') public eventService: EventService,
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,
    @Inject('SensorService') private sensorService: SensorService,
    @Inject('ZoneService') private zoneService: ZoneService,

    private snackBar: MatSnackBar,
  ) {

  }

  ngOnInit() {
    this.loadStates();

    forkJoin({
      sensors: this.sensorService.getSensors(),
      sensorTypes: this.sensorService.getSensorTypes(),
      zones: this.zoneService.getZones(),
      areas: this.areaService.getAreas()
    })
    .subscribe(results => {
      this.sensors = results.sensors;
      this.sensorTypes = results.sensorTypes.sort((st1, st2) => st1.id > st2.id ? 1 : st1.id < st2.id ? -1 : 0);
      this.zones = results.zones;
      this.areas = results.areas;
    })

    // ALERT STATE
    this.eventService.listen('alert_state_change')
      .subscribe(alert => {
        this.alert = alert;
      }
    );

    // ARM STATE
    this.eventService.listen('arm_state_change')
      .subscribe(armState => {
        this.armState = string2ArmType(armState);
        this.areaService.getAreas()
          .subscribe(areas => {
            this.areas = areas
          }
        );
        this.onStateChanged();
      });

    // AREA STATE
    this.eventService.listen('area_state_change')
      .subscribe((area: Area) => {
        this.areas.forEach(a => {
          if (a.id === area.id) {
            a.armState = area.armState
          }
        });
        this.onStateChanged();
      });

    // SENSORS ALERT STATE
    this.eventService.listen('sensors_state_change')
      .subscribe(alert => {
        this.sensorAlert = alert;
      }
    );

    // SENSOR TYPES: we need only once
    this.sensorService.getSensorTypes()
      .subscribe(st => {
        this.sensorTypes = st
      });


    // MONITORING STATE
    this.eventService.listen('system_state_change')
      .subscribe(monitoringState => {
          this.monitoringState = string2MonitoringState(monitoringState);
          this.onStateChanged();
      });

    this.eventService.listen('sensors_state_change')
      .subscribe(_ => {
        this.sensorService.getSensors()
          .subscribe(sensors => {
            this.sensors = sensors
          }
        );
      }
    );


    this.eventService.isConnected()
      .subscribe(connected => {
        if (connected) {
          this.loadStates();
        }
        else {
          this.armState = ARM_TYPE.UNDEFINED;
          this.monitoringState = MONITORING_STATE.NOT_READY;
          this.onStateChanged();
        }
      });
  }

  loadStates() {
    // ALERT STATE
    this.alertService.getAlert()
      .subscribe(alert => {
        this.alert = alert;
      });

    // ARM STATE
    this.monitoringService.getArmState()
      .subscribe(
        armState => {
          this.armState = armState;
          this.onStateChanged();
        },
        _ => {
          this.armState = ARM_TYPE.UNDEFINED;
          this.onStateChanged();
        }
      );
    
    // SENSORS ALERT STATE
    this.sensorService.getAlert()
      .subscribe(alert => {
        this.sensorAlert = alert;
      });

    // MONITORING STATE
    this.monitoringService.getMonitoringState()
      .subscribe(
        monitoringState => {
          this.monitoringState = monitoringState;
          this.onStateChanged();
        },
        _ => {
          this.monitoringState = MONITORING_STATE.NOT_READY;
          this.onStateChanged();
        }
      );
  }

  ngOnDestroy(){
    this.loader.clearMessage();
  }

  onStateChanged() {
    if (this.armState === ARM_TYPE.UNDEFINED || this.monitoringState === MONITORING_STATE.NOT_READY) {
      this.loader.setMessage($localize`:@@message lost connection:Lost connection to the security system!`);
    }
    else {
      this.loader.clearMessage();
    }
  }

  armChanged(event) {
    if (event.value === 'AWAY') {
      this.action = 'armed away';
      this.monitoringService.arm(ARM_TYPE.AWAY)
        .subscribe(() => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration}));
    } else if (event.value === 'STAY') {
      this.action = 'armed stay';
      this.monitoringService.arm(ARM_TYPE.STAY)
        .subscribe(() => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration}));
    } else if (event.value === 'DISARMED') {
      this.action = 'disarmed';
      this.monitoringService.disarm()
        .subscribe(() => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration}));
    }
  }

  isAwayDisabled() {
    return this.sensorAlert || 
      this.armState !== ARM_TYPE.DISARMED ||
      this.monitoringState !== MONITORING_STATE.READY ||
      this.monitoringState === MONITORING_STATE.READY && this.alert !== null && this.alert !== undefined
  }

  isStayDisabled() {
    return this.sensorAlert ||
      this.armState !== ARM_TYPE.DISARMED ||
      this.monitoringState !== MONITORING_STATE.READY ||
      this.monitoringState === MONITORING_STATE.READY && this.alert !== null && this.alert !== undefined
  }

  getSensorTypeName(sensorTypeId: number) {
    if (this.sensorTypes.length && sensorTypeId != null) {
      return this.sensorTypes.find(x => x.id === sensorTypeId).name;
    }

    return '';
  }

  getSensorDelay(areaId: number, zoneId: number) : number {
    const armState = this.areas.find(a => a.id == areaId).armState
    if (armState === ARM_TYPE.AWAY) {
      return this.zones.find(z => z.id === zoneId).awayAlertDelay;
    }
    if (armState === ARM_TYPE.STAY) {
      return this.zones.find(z => z.id === zoneId).stayAlertDelay;
    }
    if (armState === ARM_TYPE.DISARMED) {
      return this.zones.find(z => z.id === zoneId).disarmedDelay;
    }
    
    return null;
  }

  getSensors(areaId: number) : Sensor[] {
    return this.sensors.filter(sensor => sensor.areaId === areaId)
  }
  
  getSensorDelays(areaId: number) : number[] {
    let sensors = this.getSensors(areaId);

    return sensors.map(sensor => this.getSensorDelay(sensor.areaId, sensor.zoneId))
  }
}
