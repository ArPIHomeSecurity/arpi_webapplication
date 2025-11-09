import { LocationVersion } from './version';

export class Location {
  id: string | null;
  name: string;
  scheme = 'https';
  primaryDomain = '';
  primaryPort: number = null;
  secondaryDomain = '';
  secondaryPort: number = null;
  version: LocationVersion | null;
  order = 0;
}
