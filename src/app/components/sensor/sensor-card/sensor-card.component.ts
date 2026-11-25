import { Component, EventEmitter, Input, Output } from "@angular/core"

import { MONITORING_STATE, Sensor } from "@app/models"

export interface SensorAttribute {
  icon: string
  iconClass?: string
  label: string
  contents: string[]
}

@Component({
  selector: "app-sensor-card",
  templateUrl: "./sensor-card.component.html",
  styleUrls: ["./sensor-card.component.scss"],
  standalone: false
})
export class SensorCardComponent {
  @Input() sensor: Sensor
  @Input() iconName: string
  @Input() attributeGroups: SensorAttribute[][] = []
  @Input() canEdit = false
  @Input() dragDisabled = false
  @Input() monitoringState: MONITORING_STATE

  @Output() resetReferences = new EventEmitter<number>()
  @Output() deleteRequested = new EventEmitter<number>()

  readonly monitoringStates = MONITORING_STATE
}
