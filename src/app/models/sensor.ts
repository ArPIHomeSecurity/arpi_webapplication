export enum SensorEOLCount {
  SINGLE = 'single',
  DOUBLE = 'double'
}

export enum SensorContactTypes {
  NO = 'NO',
  NC = 'NC'
}

export enum ChannelTypes {
  BASIC = 'basic',
  NORMAL = 'normal',
  CHANNEL_A = 'channel_a',
  CHANNEL_B = 'channel_b'
}

export class Sensor {
  id: number;
  name: string;
  description: string;

  channel: number;
  channelType: ChannelTypes;
  sensorContactType: SensorContactTypes;
  sensorEolCount: SensorEOLCount;
  typeId: number;

  areaId: number;
  zoneId: number;

  alert: boolean;
  error: boolean;
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
