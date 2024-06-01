import { ARM_TYPE, Alert, Arm, ArmEvent, Disarm, OutputTriggerType, ROLE_TYPES } from '@app/models';

export const DEMO_CONFIGURATION = [
    {
        option: 'notifications',
        section: 'smtp',
        value: {
            smtp_username: 'test_user',
            smtp_password: 'password',
            smtp_hostname: 'smtp.domain.com',
            smtp_port: 587,
            email1_address: 'target_user1@domain.com',
        }
    },
    {
        option: 'notifications',
        section: 'gsm',
        value: {
            pinCode: '1234',
            phoneNumber: '0036123456789'
        }
    },
    {
        option: 'notifications',
        section: 'subscriptions',
        value: {
            email: {
                alertStarted: true,
                alertStopped: true
            },
            sms: {
                alertStarted: true,
                alertStopped: true
            }
        }
    },
    {
        option: 'network',
        section: 'dyndns',
        value: {
            username: 'user',
            hostname: 'my-example-host.com',
            provider: 'noip',
            password: 'password'
        }
    },
    {
        option: 'network',
        section: 'access',
        value: {
            ssh: true
        }
    },
    {
        option: 'syren',
        section: 'timing',
        value: {
            sylent: false,
            delay: 0,
            duration: null
        }
    }
];

export const USERS = [
    {
        id: 1,
        name: 'Administrator',
        email: 'admin@example.com',
        role: ROLE_TYPES.ADMIN,
        hasRegistrationCode: true,
        registrationCode: 'ABCDEF000001',
        accessCode: 1234,
        comment: '',
        registrationExpiry: new Date().toISOString().split(".")[0].replace("T", " ")
    },
    {
        id: 2,
        name: 'User 1',
        email: 'user1@example.com',
        role: ROLE_TYPES.USER,
        hasRegistrationCode: true,
        registrationCode: 'ABCDEF000002',
        accessCode: 1111,
        comment: '',
        registrationExpiry: new Date().toISOString().split(".")[0].replace("T", " ")
    }
];
export const SENSORS = [
    {
        id: 0,
        channel: 0,
        zoneId: 0,
        areaId: 0,
        typeId: 1,
        alert: false,
        description: 'Test 1',
        enabled: true
    },
    {
        id: 1,
        channel: 1,
        zoneId: 1,
        areaId: 0,
        typeId: 2,
        alert: false,
        description: 'Tamper',
        enabled: true
    },
    {
        id: 2,
        channel: 2,
        zoneId: 0,
        areaId: 1,
        typeId: 1,
        alert: false,
        description: 'Test 2',
        enabled: true
    }
];

export const SENSOR_TYPES = [
    {
        id: 1,
        name: 'Motion',
        description: 'Motion sensor',
    },
    {
        id: 2,
        name: 'Tamper',
        description: 'Tamper sensor',
    },
    {
        id: 3,
        name: 'Open',
        description: 'Open sensor',
    },
    {
        id: 4,
        name: 'Break',
        description: 'Break sensor',
    }
];

export const ZONES = [
    {
        id: 0,
        name: 'Stay delayed',
        disarmedDelay: null,
        awayArmDelay: 0,
        stayArmDelay: 5,
        awayAlertDelay: 0,
        stayAlertDelay: 5,
        description: 'Arm and alert with delay if stay armed'
    },
    {
        id: 1,
        name: 'Tamper',
        disarmedDelay: 0,
        awayArmDelay: 0,
        stayArmDelay: 0,
        awayAlertDelay: 0,
        stayAlertDelay: 0,
        description: 'Sabotage'
    }
];

export const OUTPUTS = [
    {
        id: 0,
        name: "System",
        description: "System is armed",
        channel: 1,
        state: false,
        triggerType: OutputTriggerType.SYSTEM,
        areaId: null,
        delay: 0,
        duration: 0,
        defaultState: false,
        uiOrder: 0,
        enabled: true
    },
    {
        id: 1,
        name: "Garage door",
        description: "Send signal to garage door",
        channel: 2,
        state: false,
        triggerType: OutputTriggerType.BUTTON,
        areaId: null,
        delay: 1,
        duration: 1,
        defaultState: false,
        uiOrder: 1,
        enabled: true
    }
]

export const AREAS = [
    {
        id: 0,
        name: "Ground floor",
        armState: ARM_TYPE.DISARMED
    },
    {
        id: 1,
        name: "Attic",
        armState: ARM_TYPE.DISARMED
    }
]

export const ALERTS: Alert[] = [];

export const ARMS: Arm[] = [];

export const DISARMS: Disarm[] = [];

export const EVENTS: ArmEvent[] = [];

export const KEYPAD_TYPES = [
    {
        id: 1,
        name: 'DSC',
        description: 'DSC keybus (DSC PC-1555RKZ)'
    },
    {
        id: 2,
        name: 'Wiegand',
        description: 'Keypad with Wiegand protocol'
    }
];

export const KEYPADS = [
    {
        id: 1,
        enabled: true,
        typeId: 1
    }
];

export const CARDS = [
    {
        id: 1,
        userId: null,
        enabled: true,
        description: "Card 01"
    }
];

