
export class Location {
  id: string | null;
  name: string;
  scheme: string = 'https';
  primaryDomain: string = '';
  primaryPort: number = null;
  secondaryDomain: string = '';
  secondaryPort: number = null;
  order: number = 0;
}
