// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=demo` then `environment.demo.ts` will be used instead.
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
  SensorService,
  UserService,
  ZoneService
} from 'src/app/services/demo';

export const environment = {
  production: false,
  demo: true,
  delay: 100,

  channelCount: 3,
  snackDuration: 5000,

  apiPort: 8080,
  monitoringPort: 8081,

  defaultLanguage: 'en',
  languages: 'hu',

  // authentication toket valid for 15 mins
  userTokenExpiry: 60*15,

  // Service types
  alertService: AlertService,
  armService: ArmService,
  authenticationService: AuthenticationService,
  cardService: CardService,
  configurationService: ConfigurationService,
  eventService: EventService,
  keypadService: KeypadService,
  loaderService: LoaderService,
  monitoringService: MonitoringService,
  sensorService: SensorService,
  userService: UserService,
  zoneService: ZoneService
};
