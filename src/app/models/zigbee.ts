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
  metadata?: any
}
