export class Sensor {
  id: number;
  name: string;
  description: string;
  channel: number;
  typeId: number;
  areaId: number;
  zoneId: number;

  alert: boolean;
  enabled: boolean;
  silentAlert: boolean;
  monitorPeriod: number;
  monitorThreshold: number;

  uiOrder: number = null;
  uiHidden: boolean = null;
}

export class SensorType {
  id: number;
  name: string;
  description: string;
}
