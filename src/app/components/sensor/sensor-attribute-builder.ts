import {
  Area,
  ChannelTypes,
  Sensor,
  SensorContactTypes,
  SensorEOLCount,
  SensorType,
  ZigbeeDevice,
  Zone,
  getZigbeeEntityLabel
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
    label: $localize`:@@sensor type:Sensor type`,
    contents: getContents(SensorType.getLabel(sensorTypeName))
  })

  const zigbeeDevice =
    sensor.zigbeeDeviceId != null ? zigbeeDevicesById.get(sensor.zigbeeDeviceId) : undefined
  const zigbeeDeviceName = zigbeeDevice?.name || zigbeeDevice?.ieeeAddress
  const zigbeeEntity = zigbeeDevice?.metadata?.entities?.find(
    entity => entity.entityId === sensor.zigbeeEntityId
  )
  const zigbeeEntityName = zigbeeEntity
    ? getZigbeeEntityLabel(zigbeeEntity)
    : undefined

  attributes.push({
    icon: sensor.zigbeeDeviceId != null ? "wifi" : "label",
    ...getSensorBindingContent(
      zigbeeDeviceName,
      zigbeeEntityName,
      sensor.channel,
      sensor.zigbeeDeviceId != null
    )
  })

  if (boardVersion >= 3 && sensor.zigbeeDeviceId == null) {
    attributes.push({
      icon: "device_hub",
      label: $localize`:@@sensor channel type:Channel type`,
      contents: getContents(getChannelTypeLabel(sensor.channelType))
    })
    attributes.push({
      icon: "toggle_on",
      label: $localize`:@@sensor contact type:Contact type`,
      contents: getContents(getContactTypeLabel(sensor.sensorContactType))
    })
    attributes.push({
      icon: "square",
      label: $localize`:@@sensor eol count:EOL count`,
      contents: getContents(getEOLCountLabel(sensor.sensorEolCount))
    })
  }

  attributes.push({
    icon: "crop",
    label: $localize`:@@sensor area form:Area`,
    contents: getContents(areas.find(area => area.id === sensor.areaId)?.name ?? "")
  })
  attributes.push({
    icon: "rectangle",
    label: $localize`:@@sensor zone form:Zone`,
    contents: getContents(
      sensor.channel !== -1 ? (zones.find(zone => zone.id === sensor.zoneId)?.name ?? "") : "-"
    )
  })
  attributes.push({
    icon: sensor.silentAlert ? "volume_mute" : "volume_up",
    label: $localize`:@@sensor syren:Syren config`,
    contents: getContents(getSilentAlertLabel(sensor.silentAlert))
  })
  attributes.push({
    icon: "tune",
    label: $localize`:@@sensor sensitivity:Sensor sensitivity`,
    contents: getContents(getMonitorSettingsLabel(sensor.monitorPeriod, sensor.monitorThreshold))
  })
  attributes.push({
    icon: sensor.enabled ? "check_circle" : "circle",
    iconClass: sensor.enabled ? "sensor-status-icon-enabled" : "",
    label: $localize`:@@sensor status:Sensor status`,
    contents: getContents(
      sensor.enabled ? $localize`:@@sensor enabled:Enabled` : $localize`:@@sensor disable:Disabled`
    )
  })
  attributes.push({
    icon: sensor.uiHidden ? "visibility_off" : "visibility",
    iconClass: sensor.uiHidden ? "sensor-status-icon-hide" : "sensor-status-icon-show",
    label: $localize`:@@sensor visibility:Visibility`,
    contents: getContents(
      sensor.uiHidden ? $localize`:@@sensor hidden:Hidden` : $localize`:@@sensor visible:Visible`
    )
  })

  return attributes
}

function getSensorBindingContent(
  deviceName: string | undefined,
  signalName: string | undefined,
  channel: number,
  isZigbee: boolean
): Pick<SensorAttribute, "label" | "contents"> {
  switch (true) {
    case deviceName != null && signalName != null:
      return {
        label: $localize`:@@sensor zigbee device:Zigbee device`,
        contents: [deviceName, signalName]
      }
    case deviceName != null:
      return { label: $localize`:@@sensor zigbee device:Zigbee device`, contents: [deviceName] }
    case channel !== -1:
      return {
        label: $localize`:@@sensor channel:Channel`,
        contents: [`CH${(channel + 1).toString().padStart(2, "0")}`]
      }
    default:
      return {
        label: isZigbee
          ? $localize`:@@sensor zigbee device:Zigbee device`
          : $localize`:@@sensor channel:Channel`,
        contents: ["-"]
      }
  }
}

function getContents(content: string): string[] {
  return content ? [content] : []
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
