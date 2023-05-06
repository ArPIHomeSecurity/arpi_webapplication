import { Component, Inject, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ARM_TYPE, Alert, Area, MONITORING_STATE, Sensor, SensorType } from 'src/app/models';
import { AreaService } from 'src/app/services';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-area',
  templateUrl: './area.html',
  styleUrls: ['./area.scss']
})
export class AreaComponent implements OnInit {
  @Input() area:Area;
  @Input() delays:number[];
  @Input() sensors:Sensor[];
  @Input("data") sensorTypes:SensorType[];
  @Input() sensorAlert: boolean;
  @Input() monitoringState: MONITORING_STATE;

  @ViewChild('snackbarTemplate') snackbarTemplate: TemplateRef<any>;

  action: string;
  alert: Alert;
  armTypes: any = ARM_TYPE;
  monitoringStates: any = MONITORING_STATE;

  constructor(
    @Inject('AreaService') private areaService: AreaService,

    private snackBar: MatSnackBar,
  ) {

  }

  ngOnInit(): void {
    console.log("This:", this);
  }

  armChanged(event) {
    if (event.value === 'AWAY') {
      this.action = 'armed away';
      this.areaService.arm(this.area.id, ARM_TYPE.AWAY)
        .subscribe(() => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration}));
    } else if (event.value === 'STAY') {
      this.action = 'armed stay';
      this.areaService.arm(this.area.id, ARM_TYPE.STAY)
        .subscribe(() => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration}));
    } else if (event.value === 'DISARMED') {
      this.action = 'disarmed';
      this.areaService.disarm(this.area.id)
        .subscribe(() => this.snackBar.openFromTemplate(this.snackbarTemplate, {duration: environment.snackDuration}));
    }
  }
}
