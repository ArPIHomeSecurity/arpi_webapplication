import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { ARM_TYPE, MONITORING_STATE } from '@app/models';


@Component({
    selector: 'component-controller',
    templateUrl: 'controller.html',
    styleUrls: ['controller.scss'],
    providers: []
})
export class ControllerComponent {
  @Input() armState:ARM_TYPE = ARM_TYPE.UNDEFINED;
  @Input() monitoringState:MONITORING_STATE = MONITORING_STATE.UNDEFINED;
  @Input() systemAlert: boolean;
  @Input() sensorAlert: boolean;
  @Output() armChanged = new EventEmitter<ARM_TYPE>();
  

  armTypes: any = ARM_TYPE;
  monitoringStates: any = MONITORING_STATE;

  isAwayArmDisabled() {
    return (
      this.sensorAlert ||
      this.systemAlert ||
      this.armState !== ARM_TYPE.DISARMED ||
      this.monitoringState !== MONITORING_STATE.READY && this.monitoringState !== MONITORING_STATE.ARMED
    )
  }

  isStayArmDisabled() {
    return (
      this.sensorAlert ||
      this.systemAlert ||
      this.armState !== ARM_TYPE.DISARMED ||
      this.monitoringState !== MONITORING_STATE.READY && this.monitoringState !== MONITORING_STATE.ARMED
    )
  }

  isDisarmDisabled() {
    // you can disarm if the system is armed or in sabotage state
    return this.armState === ARM_TYPE.DISARMED &&
      ![
        MONITORING_STATE.ARM_DELAY,
        MONITORING_STATE.ARMED,
        MONITORING_STATE.ALERT_DELAY,
        MONITORING_STATE.SABOTAGE
      ].includes(this.monitoringState)
  }

  armChangedHandler(event: MatButtonToggleChange, arm: ARM_TYPE) {
    this.armChanged.emit(arm)
    event.source.checked = true
  }
}
