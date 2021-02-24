
export enum POWER_STATE {
    UNDEFINED = 0,
    NETWORK = 1,
    BATTERY = 2
}

// power  states from the backend
const POWER_SOURCE_NETWORK = 'network'
const POWER_SOURCE_BATTERY = 'battery'

export const string2PowerState = (systemState: string): POWER_STATE => ({
    [POWER_SOURCE_NETWORK]: POWER_STATE.NETWORK,
    [POWER_SOURCE_BATTERY]: POWER_STATE.BATTERY,
})[systemState as keyof typeof string2PowerState];
  
  
export const powerState2String = (systemState: POWER_STATE): string => ({
    [POWER_STATE.NETWORK]: POWER_SOURCE_NETWORK,
    [POWER_STATE.BATTERY]: POWER_SOURCE_BATTERY,
})[systemState];
