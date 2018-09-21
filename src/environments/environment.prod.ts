export const environment = {
  production: true,

  channel_count: 15,
  SNACK_DURATION: 2000,

  MONITORING_PORT: 443,

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
