// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=demo` then `environment.demo.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

import {
  AlertService,
  AreaService,
  ArmService,
  AuthenticationService,
  BiometricService,
  CardService,
  ConfigurationService,
  EventService,
  KeypadService,
  LoaderService,
  MonitoringService,
  OutputService,
  SensorService,
  UserService,
  ZoneService
} from '@app/services/demo';

export const environment = {
  production: false,
  demo: true,
  delay: 100,

  channelCount: 3,
  snackDuration: 5000,

  isMultiLocation: true,
  showApiLink: true,

  defaultLanguage: 'en',
  languages: 'hu it',

  // authentication token valid for 15 mins
  userTokenExpiry: 60 * 15,

  // Service types
  alertService: AlertService,
  areaService: AreaService,
  armService: ArmService,
  authenticationService: AuthenticationService,
  biometricService: BiometricService,
  cardService: CardService,
  configurationService: ConfigurationService,
  eventService: EventService,
  keypadService: KeypadService,
  loaderService: LoaderService,
  monitoringService: MonitoringService,
  outputService: OutputService,
  sensorService: SensorService,
  userService: UserService,
  zoneService: ZoneService
};
