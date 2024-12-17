import { Component, Inject, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { App as CapacitorApp } from '@capacitor/app';

import { Alert, ARM_TYPE, MONITORING_STATE, string2ArmType, string2MonitoringState, SensorType, Sensor, Zone, Area, Output, OutputTriggerType } from '@app/models';
import { AlertService, AreaService, EventService, LoaderService, MonitoringService, OutputService, SensorService, ZoneService } from '@app/services';

import { environment } from '@environments/environment';
import { forkJoin, Subscription } from 'rxjs';

import { CapacitorService } from '@app/services/capacitor.service';


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
  sensorTypes: SensorType[] = [];
  zones: Zone[] = [];
  areas: Area[] = [];
  outputs: Output[] = [];

  goBackSubscription: Subscription

  constructor(
    @Inject('AlertService') private alertService: AlertService,
    @Inject('AreaService') private areaService: AreaService,
    @Inject('EventService') public eventService: EventService,
    @Inject('LoaderService') public loader: LoaderService,
    @Inject('MonitoringService') public monitoringService: MonitoringService,
    @Inject('OutputService') private outputService: OutputService,
    @Inject('SensorService') private sensorService: SensorService,
    @Inject('ZoneService') private zoneService: ZoneService,
    @Inject('CapacitorService') private capacitorService: CapacitorService,

    private snackBar: MatSnackBar,
  ) {

  }

  ngOnInit() {
    this.goBackSubscription = this.capacitorService.listenBackButton().subscribe(() => {
      console.log('Pressed backButton - on home');
      CapacitorApp.exitApp();
    });

    this.loadStates();

    forkJoin({
      sensors: this.sensorService.getSensors(),
      sensorTypes: this.sensorService.getSensorTypes(),
      zones: this.zoneService.getZones(),
      areas: this.areaService.getAreas(),
      outputs: this.outputService.getOutputs()
    })
      .subscribe(results => {
        this.sensors = results.sensors.sort((s1, s2) => s1.uiOrder > s2.uiOrder ? 1 : s1.uiOrder < s2.uiOrder ? -1 : 0);
        this.sensorTypes = results.sensorTypes.sort((st1, st2) => st1.id > st2.id ? 1 : st1.id < st2.id ? -1 : 0);
        this.zones = results.zones;
        this.areas = results.areas.sort((a1, a2) => a1.uiOrder > a2.uiOrder ? 1 : a1.uiOrder < a2.uiOrder ? -1 : 0);
        this.outputs = results.outputs
          .filter(o => o.triggerType === OutputTriggerType.BUTTON)
          .filter(o => o.enabled)
          .sort((o1, o2) => o1.uiOrder > o2.uiOrder ? 1 : o1.uiOrder < o2.uiOrder ? -1 : 0);
      });

    // ALERT STATE
    this.eventService.listen('alert_state_change')
      .subscribe(alert => {
        this.alert = alert;
      });

    // ARM STATE
    this.eventService.listen('arm_state_change')
      .subscribe(armState => {
        this.armState = string2ArmType(armState);
        this.areaService.getAreas()
          .subscribe(areas => {
            this.areas = areas.sort((a, b) => a.uiOrder > b.uiOrder ? 1 : a.uiOrder < b.uiOrder ? -1 : 0);
          });
        this.onStateChanged();
      });

    // AREA STATE
    this.eventService.listen('area_state_change')
      .subscribe((area: Area) => {
        this.areaService.getAreas()
          .subscribe(areas => {
            this.areas = areas.sort((a, b) => a.uiOrder > b.uiOrder ? 1 : a.uiOrder < b.uiOrder ? -1 : 0);
          });
        this.onStateChanged();
      });

    // SENSORS ALERT STATE
    this.eventService.listen('sensors_state_change')
      .subscribe(alert => {
        this.sensorAlert = alert;
      });

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
            this.sensors = sensors.sort((a, b) => a.uiOrder > b.uiOrder ? 1 : a.uiOrder < b.uiOrder ? -1 : 0);
          });
      });

    this.eventService.listen('output_state_change')
      .subscribe(output => {
        const tmpOutput = this.outputs.find(o => o.id === output.id)
        if (tmpOutput) {
          tmpOutput.state = output.state
        }
      });


    this.eventService.isConnected()
      .subscribe(connected => {
        if (connected) {
          this.loadStates();
        }
        else {
          this.armState = ARM_TYPE.UNDEFINED;
          this.monitoringState = MONITORING_STATE.UNDEFINED;
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
      .subscribe({
        next: armState => {
          this.armState = armState;
          this.onStateChanged();
        },
        error: _ => {
          this.armState = ARM_TYPE.UNDEFINED;
          this.onStateChanged();
        }
      });

    // SENSORS ALERT STATE
    this.sensorService.getAlert()
      .subscribe(alert => {
        this.sensorAlert = alert;
      });

    // MONITORING STATE
    this.monitoringService.getMonitoringState()
      .subscribe({
        next: monitoringState => {
          this.monitoringState = monitoringState;
          this.onStateChanged();
        },
        error: _ => {
          this.monitoringState = MONITORING_STATE.UNDEFINED;
          this.onStateChanged();
        }
      });
  }

  ngOnDestroy() {
    if (this.goBackSubscription) {
      this.goBackSubscription.unsubscribe();
    }
    this.loader.clearMessage();
  }

  onStateChanged() {
    if (this.armState === ARM_TYPE.UNDEFINED || this.monitoringState === MONITORING_STATE.UNDEFINED) {
      this.loader.setMessage($localize`:@@message lost connection:Lost connection to the security system!`);
    }
    else {
      this.loader.clearMessage();
    }
  }

  armChanged(armType: ARM_TYPE) {
    if (armType === ARM_TYPE.AWAY) {
      this.action = 'armed away';
      this.monitoringService.arm(ARM_TYPE.AWAY)
        .subscribe(() => this.snackBar.openFromTemplate(this.snackbarTemplate, { duration: environment.snackDuration }));
    } else if (armType === ARM_TYPE.STAY) {
      this.action = 'armed stay';
      this.monitoringService.arm(ARM_TYPE.STAY)
        .subscribe(() => this.snackBar.openFromTemplate(this.snackbarTemplate, { duration: environment.snackDuration }));
    } else if (armType === ARM_TYPE.DISARMED) {
      this.action = 'disarmed';
      this.monitoringService.disarm()
        .subscribe(() => this.snackBar.openFromTemplate(this.snackbarTemplate, { duration: environment.snackDuration }));
    }
  }

  isOutputDisabled(output: Output) {
    const disabledStates = [
      MONITORING_STATE.UNDEFINED,
      MONITORING_STATE.STARTUP,
      MONITORING_STATE.UPDATING_CONFIG,
      MONITORING_STATE.INVALID_CONFIG,
      MONITORING_STATE.ERROR,
    ];
    return (
      this.armState === ARM_TYPE.UNDEFINED
      || disabledStates.includes(this.monitoringState)
      || output.state === true && output.duration > 0
    );
  }

  getSensorTypeName(sensorTypeId: number) {
    if (this.sensorTypes.length && sensorTypeId != null) {
      return this.sensorTypes.find(x => x.id === sensorTypeId).name;
    }

    return '';
  }

  getSensorDelay(areaId: number, zoneId: number): number {
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

  getSensors(areaId: number): Sensor[] {
    return this.sensors.filter(sensor => sensor.areaId === areaId)
  }

  getSensorDelays(areaId: number): number[] {
    let sensors = this.getSensors(areaId);

    return sensors.map(sensor => this.getSensorDelay(sensor.areaId, sensor.zoneId))
  }

  areaIdentify(index: number, area: Area) {
    return area.id;
  }
}
