import {
  Area,
  ChannelTypes,
  Sensor,
  SensorContactTypes,
  SensorEOLCount,
  SensorType,
  ZigbeeDevice,
  Zone
} from "@app/models"

import type { SensorAttribute } from "./sensor-card/sensor-card.component"

export function buildSensorAttributes(
  sensor: Sensor,
  sensorTypes: SensorType[],
  zigbeeDevicesById: Map<number, ZigbeeDevice>,
  zones: Zone[],
  areas: Area[],
  boardVersion: number
): SensorAttribute[] {
  const attributes: SensorAttribute[] = []
  const sensorTypeName = sensorTypes.find(type => type.id === sensor.typeId)?.name ?? ""

  attributes.push({
    icon: SensorType.getIconName(sensorTypeName),
    content: SensorType.getLabel(sensorTypeName)
  })

  const zigbeeDevice =
    sensor.zigbeeDeviceId != null ? zigbeeDevicesById.get(sensor.zigbeeDeviceId) : undefined

  attributes.push({
    icon: sensor.zigbeeDeviceId != null ? "wifi" : "label",
    content:
      zigbeeDevice?.name ||
      zigbeeDevice?.ieeeAddress ||
      (sensor.channel !== -1 ? `CH${(sensor.channel + 1).toString().padStart(2, "0")}` : "-")
  })

  if (boardVersion >= 3 && sensor.zigbeeDeviceId == null) {
    attributes.push({
      icon: "device_hub",
      content: getChannelTypeLabel(sensor.channelType)
    })
    attributes.push({
      icon: "toggle_on",
      content: getContactTypeLabel(sensor.sensorContactType)
    })
    attributes.push({
      icon: "square",
      content: getEOLCountLabel(sensor.sensorEolCount)
    })
  }

  attributes.push({
    icon: "crop",
    content: areas.find(area => area.id === sensor.areaId)?.name ?? ""
  })
  attributes.push({
    icon: "rectangle",
    content:
      sensor.channel !== -1 ? (zones.find(zone => zone.id === sensor.zoneId)?.name ?? "") : "-"
  })
  attributes.push({
    icon: sensor.silentAlert ? "volume_mute" : "volume_up",
    content: getSilentAlertLabel(sensor.silentAlert)
  })
  attributes.push({
    icon: "tune",
    content: getMonitorSettingsLabel(sensor.monitorPeriod, sensor.monitorThreshold)
  })
  attributes.push({
    icon: sensor.enabled ? "check_circle" : "circle",
    iconClass: sensor.enabled ? "sensor-status-icon-enabled" : "",
    content: sensor.enabled
      ? $localize`:@@sensor enabled:Enabled`
      : $localize`:@@sensor disable:Disabled`
  })
  attributes.push({
    icon: sensor.uiHidden ? "visibility_off" : "visibility",
    iconClass: sensor.uiHidden ? "sensor-status-icon-hide" : "sensor-status-icon-show",
    content: sensor.uiHidden
      ? $localize`:@@sensor hidden:Hidden`
      : $localize`:@@sensor visible:Visible`
  })

  return attributes
}

export function buildSensorAttributeGroups(
  sensor: Sensor,
  sensorTypes: SensorType[],
  zigbeeDevicesById: Map<number, ZigbeeDevice>,
  zones: Zone[],
  areas: Area[],
  boardVersion: number
): SensorAttribute[][] {
  const attributes = buildSensorAttributes(
    sensor,
    sensorTypes,
    zigbeeDevicesById,
    zones,
    areas,
    boardVersion
  )
  const groupSize = Math.ceil(attributes.length / 2)

  return [attributes.slice(0, groupSize), attributes.slice(groupSize)]
}

function getChannelTypeLabel(channelType: ChannelTypes | null): string {
  switch (channelType) {
    case ChannelTypes.BASIC:
      return $localize`:@@sensor channel basic:Basic`
    case ChannelTypes.NORMAL:
      return $localize`:@@sensor channel normal:Normal`
    case ChannelTypes.CHANNEL_A:
      return $localize`:@@sensor channel a:Channel A`
    case ChannelTypes.CHANNEL_B:
      return $localize`:@@sensor channel b:Channel B`
    default:
      return ""
  }
}

function getContactTypeLabel(contactType: SensorContactTypes | null): string {
  switch (contactType) {
    case SensorContactTypes.NC:
      return $localize`:@@sensor contact nc: Normally Closed (NC) `
    case SensorContactTypes.NO:
      return $localize`:@@sensor contact no: Normally Open (NO) `
    default:
      return ""
  }
}

function getEOLCountLabel(eolCount: SensorEOLCount | null): string {
  switch (eolCount) {
    case SensorEOLCount.SINGLE:
      return $localize`:@@sensor eol single:Single EOL`
    case SensorEOLCount.DOUBLE:
      return $localize`:@@sensor eol double:Double EOL`
    default:
      return ""
  }
}

function getSilentAlertLabel(silentAlert: boolean | null): string {
  if (silentAlert === false) return $localize`:@@sensor silent syren:Alarm with syren`
  if (silentAlert === true) return $localize`:@@sensor silent alert:Silent alert`
  return "-"
}

function getMonitorSettingsLabel(
  monitorPeriod: number | null,
  monitorThreshold: number | null
): string {
  if (monitorPeriod != null) {
    return `${monitorPeriod !== null ? monitorPeriod + "s" : "-"}/${monitorThreshold}%`
  }
  if (monitorPeriod === null && monitorThreshold != null) {
    return $localize`:@@sensor instant:Instant alert`
  }
  return "-"
}
