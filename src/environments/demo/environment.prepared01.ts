// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=demo` then `environment.demo.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  demo: true,
  aotTranslations: true,
  delay: 100,

  channel_count: 3,
  SNACK_DURATION: 2000,

  MONITORING_PORT: 8081,

  DEFAULT_LANGUAGE: 'en',
  LANGUAGES: 'hu',

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

  ROLE_TYPES : {
    ADMIN: 'admin',
    USER: 'user'
  }
};

export const CONFIGURATION = [
  {
    option: 'notifications',
    section: 'email',
    value: {
      smtp_username: 'test_user',
      email_address: 'target_user@domain.com',
      smtp_password: 'password'
    }
  },
  {
    option: 'notifications',
    section: 'gsm',
    value: {
      pin_code: '1234',
      phone_number: '0036123456789'
    }
  },
  {
    option: 'notifications',
    section: 'subscriptions',
    value: {
      email: {
        alert_started: true,
        alert_stopped: true
      },
      sms: {
        alert_started: true,
        alert_stopped: true
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
  }
];

export const USERS = [
  {
    id: 0,
    name: 'Administrator',
    role: environment.ROLE_TYPES.ADMIN,
    access_code: 1234
  },
  {
    id: 1,
    name: 'User 1',
    role: environment.ROLE_TYPES.USER,
    access_code: 1111
  }
];

export const SENSORS = [
  {
    id: 0,
    channel: 0,
    zone_id: 0,
    type_id: 0,
    alert: false,
    description: 'Teszt',
    enabled: true
  }
];

export const ZONES = [
  {
    id: 0,
    name: 'Hall',
    disarmed_delay: null,
    away_delay: 5,
    stay_delay: 0,
    description: 'Hall movement, alert immediately'
  },
  {
    id: 1,
    name: 'Tamper',
    disarmed_delay: 0,
    away_delay: 0,
    stay_delay: 0,
    description: 'Sabotage'
  }
];

export const ALERTS = [];
