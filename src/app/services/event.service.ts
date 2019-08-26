import { Injectable } from '@angular/core';
import { Observable ,  BehaviorSubject } from 'rxjs';

import * as io from 'socket.io-client';

import { environment } from '../../environments/environment';

@Injectable()
export class EventService {

  socket: any;
  socketConnected$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.connect();
  }


  connect () {
    const deviceToken = localStorage.getItem('deviceToken');
    if (this.socket) {
      this.socket.disconnect();
    }
    this.socket = io.connect(
      window.location.protocol + '//' + window.location.hostname + ':' + environment.MONITORING_PORT, { query: 'token=' + deviceToken }
    );
    this.socket.on('connect', () => this.socketConnected$.next(true));
    this.socket.on('disconnect', () => this.socketConnected$.next(false));

    // this.socketConnected$.asObservable().subscribe( connected => {
    //  console.log('Socket connected: ', connected);
    // });
  }


  listen(event: string): Observable<any> {
    return new Observable(observer => {
      this.socket.on(event, data => {
        observer.next(data);
      });

      // observable is disposed
      return () => {
        this.socket.off(event, observer);
      };
    });
  }
}
