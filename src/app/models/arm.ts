import { Alert } from "./alert";

// monitoring arm types from the backend system
const ARM_AWAY = 'arm_away';
const ARM_STAY = 'arm_stay';
const ARM_DISARM = 'disarm';

export enum ARM_TYPE {
    UNDEFINED = 0,
    DISARMED = 1,
    AWAY = 2,
    STAY = 3
}

export const string2ArmType = (armType: string): ARM_TYPE => ({
    [ARM_DISARM]: ARM_TYPE.DISARMED,
    [ARM_AWAY]: ARM_TYPE.AWAY,
    [ARM_STAY]: ARM_TYPE.STAY
})[armType as keyof typeof string2ArmType];

export const armType2String = (armType: ARM_TYPE): string => ({
    [ARM_TYPE.AWAY]: ARM_AWAY,
    [ARM_TYPE.STAY]: ARM_STAY,
    [ARM_TYPE.DISARMED]: ARM_DISARM
})[armType];

export class Arm {
    id: number;
    type: ARM_TYPE;
    time: string;
    userId: number;
    keypadId: number;
    alert: Alert;
}

export class Disarm {
    id: number;
    time: string;
    userId: number;
    keypadId: number;
    arm: Arm;
}