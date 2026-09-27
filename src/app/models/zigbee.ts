export interface ZigbeeCapability {
  cluster: string
  clusterId: number
  attribute: string
  attributeId: number
  valueType: string
  sources: string[]
}

export interface ZigbeeDevice {
  id: number
  ieeeAddress: string
  networkAddress?: number
  manufacturer?: string
  model?: string
  name?: string
  availability: "online" | "offline" | "unknown" | string
  lastSeen?: string
  batteryLevel?: number
  signalQuality?: number
  sensorCount?: number
  metadata?: { capabilities?: Record<string, ZigbeeCapability> } & Record<string, unknown>
}
