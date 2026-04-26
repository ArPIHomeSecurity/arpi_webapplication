import { LocationVersion } from './version';

export class Location {
  id: string | null = null;
  name: string = '';
  scheme = 'https';
  primaryDomain = '';
  primaryPort: number | null = null;
  secondaryDomain = '';
  secondaryPort: number | null = null;
  version: LocationVersion | null = null;
  boardVersion: string | null = null;
  order = 0;
}
