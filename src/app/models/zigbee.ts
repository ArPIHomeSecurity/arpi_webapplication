export interface ZigbeeEntity {
  entityId: string
  uniqueId: string
  platform: string
  name: string
  cluster?: string | null
  attribute?: string | null
  deviceClass?: string | null
  value?: boolean | number | string | null
  available?: boolean | null
}

const zigbeeClusterLabels: Record<string, string> = {
  binary_input: $localize`:@@zigbee cluster binary input:Binary Input`,
  ias_zone: $localize`:@@zigbee cluster ias zone:IAS Zone`,
  occupancy_sensing: $localize`:@@zigbee cluster occupancy sensing:Occupancy Sensing`,
  on_off: $localize`:@@zigbee cluster on off:On/Off`,
  power_configuration: $localize`:@@zigbee cluster power configuration:Power Configuration`
}

const zigbeeAttributeLabels: Record<string, string> = {
  occupancy: $localize`:@@zigbee attribute occupancy:Occupancy`,
  on_off: $localize`:@@zigbee attribute on off:On/Off`,
  present_value: $localize`:@@zigbee attribute present value:Present value`,
  zone_status: $localize`:@@zigbee attribute zone status:Zone status`
}

export function getZigbeeEntityLabel(entity: ZigbeeEntity): string {
  const cluster = entity.cluster?.trim()
  const attribute = entity.attribute?.trim()
  const labelParts = [
    cluster ? getTranslatedZigbeeName(cluster, zigbeeClusterLabels) : "",
    attribute ? getTranslatedZigbeeName(attribute, zigbeeAttributeLabels) : ""
  ].filter(Boolean)

  if (labelParts.length > 0) {
    return labelParts.join(" / ")
  }

  return entity.name || entity.deviceClass || entity.entityId
}

function getTranslatedZigbeeName(name: string, translations: Record<string, string>): string {
  const key = name.toLowerCase().replace(/[\s/-]+/g, "_")
  return translations[key] ?? humanizeZigbeeName(name)
}

function humanizeZigbeeName(name: string): string {
  return name.replace(/[_-]+/g, " ").replace(/\b[a-z]/g, character => character.toUpperCase())
}

export interface ZigbeeDevice {
  id: number
  ieeeAddress: string
  networkAddress?: number
  manufacturer?: string
  model?: string
  name?: string
  lastSeen?: string
  batteryLevel?: number
  signalQuality?: number
  sensorCount?: number
  metadata?: { entities?: ZigbeeEntity[] } & Record<string, unknown>
}

export const ZigbeeZoneType = {
  CONTROL_AND_INDICATING_EQUIPMENT: 0x0000,
  MOTION_SENSOR: 0x000d,
  CONTACT_SWITCH: 0x0015,
  FIRE_SENSOR: 0x0028,
  WATER_SENSOR: 0x002a,
  CARBON_MONOXIDE_SENSOR: 0x002b,
  PERSONAL_EMERGENCY_DEVICE: 0x002c,
  VIBRATION_MOVEMENT_SENSOR: 0x002d,
  REMOTE_CONTROL: 0x010f,
  KEY_FOB: 0x0115,
  KEYPAD: 0x021d,
  WARNING_DEVICE: 0x0225,
  GLASS_BREAK_SENSOR: 0x0226,
  SECURITY_REPEATER: 0x0229
}

export function zigbeeZoneTypeLabel(zoneType?: number | null): string {
  const types: Record<number, string> = {
    0x0000: $localize`:@@ias type cie:Control and indicating equipment`,
    0x000d: $localize`:@@ias type motion:Motion sensor`,
    0x0015: $localize`:@@ias type contact:Contact switch`,
    0x0028: $localize`:@@ias type fire:Fire sensor`,
    0x002a: $localize`:@@ias type water:Water sensor`,
    0x002b: $localize`:@@ias type co:Carbon monoxide sensor`,
    0x002c: $localize`:@@ias type emergency:Personal emergency device`,
    0x002d: $localize`:@@ias type vibration:Vibration / movement sensor`,
    0x010f: $localize`:@@ias type remote:Remote control`,
    0x0115: $localize`:@@ias type key fob:Key fob`,
    0x021d: $localize`:@@ias type keypad:Keypad`,
    0x0225: $localize`:@@ias type warning:Warning device`,
    0x0226: $localize`:@@ias type glass:Glass break sensor`,
    0x0229: $localize`:@@ias type repeater:Security repeater`
  }
  if (zoneType == null || zoneType === 0xffff) {
    return $localize`:@@zigbee unknown:Unknown`
  }
  return types[zoneType] ?? `0x${zoneType.toString(16).padStart(4, "0")}`
}
