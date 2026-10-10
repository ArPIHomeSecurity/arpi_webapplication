export enum SensorEOLCount {
  SINGLE = "single",
  DOUBLE = "double"
}

export enum SensorContactTypes {
  NO = "NO",
  NC = "NC"
}

export enum ChannelTypes {
  BASIC = "basic",
  NORMAL = "normal",
  CHANNEL_A = "channel_a",
  CHANNEL_B = "channel_b"
}

export class Sensor {
  id: number
  name: string
  description: string

  channel: number
  channelType: ChannelTypes
  sensorContactType: SensorContactTypes
  sensorEolCount: SensorEOLCount
  typeId: number

  zigbeeDeviceId?: number
  zigbeeEndpoint?: string
  zigbeeClusterId?: number
  zigbeeAttributeId?: number
  zigbeeField?: string | null

  areaId: number
  zoneId: number

  alert: boolean
  error: boolean
  enabled: boolean
  silentAlert: boolean
  monitorPeriod: number
  monitorThreshold: number

  uiOrder: number = null
  uiHidden: boolean = null
}

export class SensorType {
  /**
   * Mapping of sensor types to their corresponding icon names.
   */
  private static readonly icons: Record<string, string> = {
    Motion: "directions_run",
    Tamper: "tools_pliers_wire_stripper",
    Open: "door_open",
    Break: "broken_image",
    Contact: "door_open",
    Fire: "whatshot",
    Water: "opacity",
    CO: "air",
    Emergency: "warning",
    Vibration: "vibration",
    Remote: "settings_remote",
    "Key fob": "vpn_key",
    Keypad: "dialpad",
    Warning: "warning",
    Glass: "broken_image",
    Repeater: "wifi_tethering",
    Occupancy: "sensor_occupied"
  }

  static getIconName(typeName: string): string {
    return SensorType.icons[typeName] ?? "sensors"
  }

  static getLabel(typeName: string): string {
    switch (typeName) {
      case "Motion":
        return $localize`:@@sensor motion:Motion`
      case "Tamper":
        return $localize`:@@sensor tamper:Tamper`
      case "Open":
        return $localize`:@@sensor open:Open`
      case "Break":
        return $localize`:@@sensor break:Break`
      case "Contact":
        return $localize`:@@sensor contact:Contact`
      case "Fire":
        return $localize`:@@sensor fire:Fire`
      case "Water":
        return $localize`:@@sensor water:Water`
      case "CO":
        return $localize`:@@sensor co:CO`
      case "Emergency":
        return $localize`:@@sensor emergency:Emergency`
      case "Vibration":
        return $localize`:@@sensor vibration:Vibration`
      case "Remote":
        return $localize`:@@sensor remote:Remote`
      case "Key fob":
        return $localize`:@@sensor key fob:Key fob`
      case "Keypad":
        return $localize`:@@sensor keypad:Keypad`
      case "Warning":
        return $localize`:@@sensor warning:Warning`
      case "Glass":
        return $localize`:@@sensor glass:Glass`
      case "Repeater":
        return $localize`:@@sensor repeater:Repeater`
      case "Occupancy":
        return $localize`:@@sensor occupancy:Occupancy`
      default:
        return $localize`:@@sensor unknown:Unknown`
    }
  }

  id: number
  name: string
  description: string
}
