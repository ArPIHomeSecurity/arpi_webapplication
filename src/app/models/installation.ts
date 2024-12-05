
export class Installation {
  id: number;
  installation_id: string | null;
  version: string;
  name: string;
  scheme: string = 'https';
  primaryDomain: string = '';
  primaryPort: number = null;
  secondaryDomain: string = '';
  secondaryPort: number = null;
  order: number = 0;
}
