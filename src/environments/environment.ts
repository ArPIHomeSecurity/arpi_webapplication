// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  demo: false,
  aotTranslations: false,
  delay: 0,

  channel_count: 15,
  SNACK_DURATION: 2000,

  MONITORING_PORT: 8081,

  DEFAULT_LANGUAGE: 'en',
  LANGUAGES: 'hu',

  // monitoring arm types
  ARM_AWAY: 'arm_away',
  ARM_STAY: 'arm_stay',
  ARM_DISARM: 'disarm',

  // alert types
  ALERT_AWAY: 'alert_away',
  ALERT_STAY: 'alert_stay',
  ALERT_SABOTAGE: 'alert_sabotage',

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
