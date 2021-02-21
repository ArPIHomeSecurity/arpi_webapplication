import { ROLE_TYPES } from 'src/app/models';

export const DEMO_CONFIGURATION = [
    {
        option: 'notifications',
        section: 'email',
        value: {
            smtpUsername: 'test_user',
            emailAddress: 'target_user@domain.com',
            smtpPassword: 'password'
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
        option: 'alert',
        section: 'syren',
        value: {
            alertTime: '360000',
            suspendTime: '180000',
        }
    }
];

export const USERS = [
    {
        id: 0,
        name: 'Administrator',
        email: 'admin@example.com',
        role: ROLE_TYPES.ADMIN,
        hasRegistrationCode: true,
        registrationCode: 'ABCDEF000001',
        accessCode: 1234,
        comment: '',
        registrationExpiry: new Date().toLocaleString()
    },
    {
        id: 1,
        name: 'User 1',
        email: 'user1@example.com',
        role: ROLE_TYPES.USER,
        hasRegistrationCode: true,
        registrationCode: 'ABCDEF000002',
        accessCode: 1111,
        comment: '',
        registrationExpiry: new Date().toLocaleString()
    }
];
export const SENSORS = [
    {
        id: 0,
        channel: 0,
        zoneId: 0,
        typeId: 1,
        alert: false,
        description: 'Teszt',
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
        name: 'Hall',
        disarmeddelay: null,
        awayDelay: 0,
        stayDelay: 5,
        description: 'Hall movement, alert with delay if stay armed'
    },
    {
        id: 1,
        name: 'Tamper',
        disarmedDelay: 0,
        awayDelay: 0,
        stayDelay: 0,
        description: 'Sabotage'
    }
];

export const ALERTS = [];

export const KEYPAD_TYPES = [
    {
        id: 1,
        name: 'DSC',
        description: 'DSC keybus (DSC PC-1555RKZ)'
    }
];

export const KEYPADS = [
    {
        id: 1,
        enabled: true,
        typeId: 1
    }
];
