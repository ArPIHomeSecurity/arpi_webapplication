import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ARM_TYPE, MONITORING_STATE } from 'src/app/models';


@Component({
    selector: 'component-controller',
    templateUrl: 'controller.html',
    styleUrls: ['controller.scss'],
    providers: []
})
export class ControllerComponent {
  @Input() armState:ARM_TYPE = ARM_TYPE.UNDEFINED;
  @Input() monitoringState:MONITORING_STATE = MONITORING_STATE.NOT_READY;
  @Input() systemAlert: boolean;
  @Input() sensorAlert: boolean;
  @Output() armChanged = new EventEmitter<ARM_TYPE>();
  

  armTypes: any = ARM_TYPE;
  monitoringStates: any = MONITORING_STATE;

  isAwayDisabled() {
    return this.sensorAlert ||
      this.armState !== ARM_TYPE.DISARMED ||
      this.monitoringState !== MONITORING_STATE.READY ||
      this.systemAlert
  }

  isStayDisabled() {
    return this.sensorAlert ||
      this.armState !== ARM_TYPE.DISARMED ||
      this.monitoringState !== MONITORING_STATE.READY ||
      this.systemAlert
  }

  armChangedHandler(arm: ARM_TYPE) {
    this.armChanged.emit(arm);
  }
}