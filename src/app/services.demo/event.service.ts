import { Injectable } from '@angular/core';
import { Observable ,  timer } from 'rxjs';


@Injectable()
export class EventService {

  timer: any;

  constructor() {
    this.connect();
  }


  connect () {
    this.timer = timer(1000000, 1000000);
  }


  listen(event: string): Observable<any> {
    return new Observable(observer => {
      this.timer.subscribe(data => {
        console.log('New time event', data);
        observer.next(data);
      });
    });
  }
}
