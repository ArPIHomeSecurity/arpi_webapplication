import { Observable } from 'rxjs';

export interface EventService {
  connect();

  isConnected(): Observable<boolean>;

  listen(event: string): Observable<any>;
}
