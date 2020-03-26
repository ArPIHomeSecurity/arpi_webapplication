export class Sensor {
  id: number;
  channel: number;
  typeId: number;
  zoneId: number;
  alert: boolean;
  enabled: boolean;
  description: string;
}

export class SensorType {
  id: number;
  name: string;
  description: string;
}
