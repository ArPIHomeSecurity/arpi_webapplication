export class Sensor {
  id: number;
  channel: number;
  type_id: number;
  zone_id: number;
  alert: boolean;
  enabled: boolean;
  description: string;
}

export class SensorType {
  id: number;
  name: string;
  description: string;
}