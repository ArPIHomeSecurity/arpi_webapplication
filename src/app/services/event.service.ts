import { Observable } from 'rxjs';


export interface EventService {

  connect();

  listen(event: string): Observable<any>;
}
