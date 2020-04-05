// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=demo` then `environment.demo.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  demo: true,
  delay: 100,

  channelCount: 3,
  SNACK_DURATION: 2000,

  MONITORING_PORT: 8081,

  DEFAULT_LANGUAGE: 'en',
  LANGUAGES: 'hu',

  // authentication toket valid for 15 mins
  USER_TOKEN_EXPIRY: 60*15,

  // monitoring arm types
  ARM_AWAY: 'away',
  ARM_STAY: 'stay',
  ARM_DISARM: 'disarm',

  // monitoring system states
  MONITORING_STARTUP: 'monitoring_startup',
  MONITORING_READY: 'monitoring_ready',
  MONITORING_UPDATING_CONFIG: 'monitoring_updating_config',
  MONITORING_INVALID_CONFIG: 'monitoring_invalid_config',
  MONITORING_ARMED: 'monitoring_armed',
  MONITORING_SABOTAGE: 'monitoring_sabotage',
  MONITORING_ERROR: 'monitoring_error',

  ROLE_TYPES : {
    ADMIN: 'admin',
    USER: 'user'
  }
};

export const CONFIGURATION = [];

export const USERS = [
  {
    id: 0,
    name: 'Administrator',
    email: 'admin@example.com',
    role: environment.ROLE_TYPES.ADMIN,
    registrationCode: 'ABCDEF000001',
    hasRegistrationCode: true,
    accessCode: 1234,
    comment: '',
    registrationExpiry: new Date().toLocaleString()
  },
  {
    id: 1,
    name: 'User 1',
    email: 'user1@example.com',
    role: environment.ROLE_TYPES.USER,
    registrationCode: 'ABCDEF000002',
    hasRegistrationCode: true,
    accessCode: 1111,
    comment: '',
    registrationExpiry: new Date().toLocaleString()
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

export const SENSORS = [];

export const ZONES = [];

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
