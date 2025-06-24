import { Component, Inject, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ARM_TYPE, Area, MONITORING_STATE, Sensor, SensorType } from '@app/models';
import { AreaService } from '@app/services';
import { environment } from '@environments/environment';

@Component({
    selector: 'component-area',
    templateUrl: './area.html',
    styleUrls: ['./area.scss'],
    standalone: false
})
export class AreaComponent implements OnInit {
  @Input() area: Area;
  @Input() delays: number[];
  @Input() sensors: Sensor[];
  @Input("data") sensorTypes: SensorType[];
  @Input() monitoringState: MONITORING_STATE;

  armTypes: any = ARM_TYPE;
  monitoringStates: any = MONITORING_STATE;
  expanded: boolean;

  constructor(
    @Inject('AreaService') private areaService: AreaService,

    private snackBar: MatSnackBar,
  ) {

  }

  ngOnInit(): void {
    this.expanded = localStorage.getItem('expanded_' + this.area.id) === 'true';
  }

  armChanged(armType: ARM_TYPE) {
    if (armType === ARM_TYPE.AWAY) {
      this.areaService.arm(this.area.id, ARM_TYPE.AWAY)
        .subscribe(() => this.snackBar.open($localize`:@@area armed away:Area armed away`, null, { duration: environment.snackDuration }));
    } else if (armType === ARM_TYPE.STAY) {
      this.areaService.arm(this.area.id, ARM_TYPE.STAY)
        .subscribe(() => this.snackBar.open($localize`:@@area armed stay:Area armed stay`, null, { duration: environment.snackDuration }));
    } else if (armType === ARM_TYPE.DISARMED) {
      this.areaService.disarm(this.area.id)
        .subscribe(() => this.snackBar.open($localize`:@@area disarmed:Area disarmed`, null, { duration: environment.snackDuration }));
    }
  }

  onToggle(expanded: boolean) {
    this.expanded = expanded;
    localStorage.setItem('expanded_' + this.area.id, this.expanded.toString());
  }

  hasAlertingSensor(): boolean {
    return this.sensors.some(sensor => sensor.alert && sensor.enabled);
  }

  canBeArmed(): boolean {
    return (
      this.area.armState === ARM_TYPE.DISARMED &&
      this.monitoringState === MONITORING_STATE.READY
    )
  }
}
