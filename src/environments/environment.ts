// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

import { 
  AlertService,
  AuthenticationService,
  ConfigurationService,
  EventService,
  KeypadService,
  LoaderService,
  MonitoringService,
  SensorService,
  UserService,
  ZoneService
} from 'src/app/services/remote';

export const environment = {
  production: false,
  demo: false,
  delay: 0,

  channelCount: 15,
  SNACK_DURATION: 2000,

  MONITORING_PORT: 8081,

  DEFAULT_LANGUAGE: 'en',
  LANGUAGES: 'hu',

  // authentication toket valid for 15 mins
  USER_TOKEN_EXPIRY: 60 * 15
};

export const ServiceTypes = {
  alertService: AlertService,
  authenticationService: AuthenticationService,
  configurationService: ConfigurationService,
  eventService: EventService,
  keypadService: KeypadService,
  loaderService: LoaderService,
  monitoringService: MonitoringService,
  sensorService: SensorService,
  userService: UserService,
  zoneService: ZoneService
};
