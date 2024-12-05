import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Installation, Option } from '@app/models';


@Injectable()
export class ConfigurationService implements ConfigurationService {
  constructor(
    private http: HttpClient
  ) { }


  getOption(option: string, section: string): Observable<Option> {
    // get configuration option from api
    return this.http.get<Option>('/api/config/' + option + '/' + section);
  }


  setOption(option: string, section: string, value: any): Observable<any> {
    // get configuration option from api
    return this.http.put('/api/config/' + option + '/' + section, value);
  }

  sendTestEmail() {
    return this.http.get('/api/config/test_email');
  }

  sendTestSMS() {
    return this.http.get('/api/config/test_sms');
  }

  getSmsMessages() {
    return this.http.get('/api/config/sms');
  }

  deleteSmsMessage(id: number) {
    return this.http.delete('/api/config/sms/' + id);
  }

  doTestCall() {
    return this.http.get('/api/config/test_call');
  }

  testSyren(duration?: number) {
    const params = duration ?
      new HttpParams().set('duration', duration)
      :
      null;
    return this.http.get('/api/config/test_syren', { params });
  }

  getPublicAccess() {
    return this.http.get<boolean>('/api/config/public_access');
  }

  getInstallation() : Observable<Installation> {
    return this.http.get<Installation>('/api/config/installation');
  }

  getInstallationId() : Observable<string> {
    return this.http.get<string>('/api/config/installation_id');
  }
}
