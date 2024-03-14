export enum OutputTriggerType {
    AREA = "area",
    SYSTEM = "system",
    BUTTON = "button"
}

export class Output {
    id: number;
    name: string | null;
    description: string | null;
    channel: number;
    state: boolean;
    triggerType: OutputTriggerType;
    areaId: number | null;
    delay: number;
    duration: number;
    defaultState: boolean;
    uiOrder: number | null;
    enabled: boolean;
}

export enum OutputType {
    OUTPUT = "output",
    RELAY = "relay"
}

// define a list of output labels and names based on channel number
export const OutputDefinitions = new Map<number, { label: string, name: string, type: OutputType }>([
    [0, { label: 'GO-/+', name: 'Syren', type: OutputType.RELAY }],
    [1, { label: 'R1', name: 'Relay 1', type: OutputType.RELAY }],
    [2, { label: 'R0', name: 'Relay 0', type: OutputType.RELAY }],
    [3, { label: 'O4', name: 'Output 4', type: OutputType.OUTPUT }],
    [4, { label: 'O3', name: 'Output 3', type: OutputType.OUTPUT }],
    [5, { label: 'O2', name: 'Output 2', type: OutputType.OUTPUT }],
    [6, { label: 'O1', name: 'Output 1', type: OutputType.OUTPUT }],
    [7, { label: 'O0', name: 'Output 0', type: OutputType.OUTPUT }],
]);

export const SYREN_CHANNEL = 0;
