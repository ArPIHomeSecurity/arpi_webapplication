import { Observable } from 'rxjs';

import { Installation, Option } from '@app/models';


export interface ConfigurationService {

  getOption(option: string, section: string): Observable<Option>;

  setOption(option: string, section: string, value: any): Observable<any>;

  sendTestEmail(): Observable<any>;
  
  sendTestSMS(): Observable<any>;

  getSmsMessages(): Observable<any>;

  deleteSmsMessage(id: number): Observable<boolean>;

  doTestCall(): Observable<any>;

  testSyren(duration?: number): Observable<any>;

  getPublicAccess(): Observable<boolean>;

  getInstallation(): Observable<Installation>;
}
