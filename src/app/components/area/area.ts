import { Component, Inject, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ARM_TYPE, Area, MONITORING_STATE, Sensor, SensorType } from '@app/models';
import { AreaService } from '@app/services';
import { environment } from '@environments/environment';

@Component({
  selector: 'component-area',
  templateUrl: './area.html',
  styleUrls: ['./area.scss']
})
export class AreaComponent implements OnInit {
  @Input() area:Area;
  @Input() delays:number[];
  @Input() sensors:Sensor[];
  @Input("data") sensorTypes:SensorType[];
  @Input() monitoringState: MONITORING_STATE;

  @ViewChild('snackbarTemplate') snackbarTemplate: TemplateRef<any>;

  action: string;
  armTypes: any = ARM_TYPE;
  monitoringStates: any = MONITORING_STATE;
  expanded: boolean;

  constructor(
    @Inject('AreaService') private areaService: AreaService,

    private snackBar: MatSnackBar,
  ) {

  }

  ngOnInit(): void {
    this.expanded = localStorage.getItem('expanded_'+this.area.id) === 'true';
  }

  armChanged(armType: ARM_TYPE) {
    if (armType === ARM_TYPE.AWAY) {
      this.action = 'armed away';
      this.areaService.arm(this.area.id, ARM_TYPE.AWAY)
        .subscribe(() => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration}));
    } else if (armType === ARM_TYPE.STAY) {
      this.action = 'armed stay';
      this.areaService.arm(this.area.id, ARM_TYPE.STAY)
        .subscribe(() => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration}));
    } else if (armType === ARM_TYPE.DISARMED) {
      this.action = 'disarmed';
      this.areaService.disarm(this.area.id)
        .subscribe(() => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration}));
    }
  }

  onToggle(expanded: boolean) {
    this.expanded = expanded;
    localStorage.setItem('expanded_'+this.area.id, this.expanded.toString());
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
