
export class Sensor {
  id: number;
  channel: number;
  typeId: number;
  areaId: number;
  zoneId: number;
  alert: boolean;
  enabled: boolean;
  description: string;

  uiOrder: number = null;
  uiHide: boolean = null;
}

export class SensorType {
  id: number;
  name: string;
  description: string;
}
