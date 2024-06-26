// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

import {
  AlertService,
  ArmService,
  AuthenticationService,
  CardService,
  ConfigurationService,
  EventService,
  KeypadService,
  LoaderService,
  MonitoringService,
  OutputService,
  SensorService,
  UserService,
  ZoneService,
  AreaService
} from '@app/services/remote';

export const environment = {
  production: true,
  demo: false,
  delay: 0,

  channelCount: 15,
  snackDuration: 5000,

  apiPort: 443,
  monitoringPort: 443,

  defaultLanguage: 'en',
  languages: 'hu it',

  // authentication token valid for 15 mins
  userTokenExpiry: 60 * 15,

  // Service types
  alertService: AlertService,
  areaService: AreaService,
  armService: ArmService,
  authenticationService: AuthenticationService,
  cardService: CardService,
  configurationService: ConfigurationService,
  eventService: EventService,
  keypadService: KeypadService,
  loaderService: LoaderService,
  monitoringService: MonitoringService,
  outputService: OutputService,
  sensorService: SensorService,
  userService: UserService,
  zoneService: ZoneService,
};
