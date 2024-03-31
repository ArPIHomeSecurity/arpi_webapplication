import { Component, Input } from '@angular/core';
import { Sensor, SensorType } from '@app/models';


@Component({
    selector: 'component-sensor',
    templateUrl: 'sensor.html',
    styleUrls: ['sensor.scss'],
    providers: []
})
export class SensorComponent {
  @Input() sensor:Sensor;
  @Input() delay:number = null;
  @Input("data") sensorTypes:SensorType[];

  getSensorTypeName(sensorTypeId: number) {
    if (this.sensorTypes.length && sensorTypeId != null) {
      return this.sensorTypes.find(x => x.id === sensorTypeId).name;
    }

    return '';
  }
}
