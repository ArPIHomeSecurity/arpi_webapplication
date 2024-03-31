import { Injectable } from '@angular/core';
import { Observable ,  Subject } from 'rxjs';

import { io } from 'socket.io-client';

import { environment } from '@environments/environment';

@Injectable()
export class EventService {

  socket: any;
  socketConnected$ = new Subject<boolean>();

  unloading = false;

  constructor() {
    this.connect();

    window.onbeforeunload= () => {
      this.unloading = true;
    };
  }

  isConnected() {
    return this.socketConnected$;
  }

  connect() {
    const deviceToken = localStorage.getItem('deviceToken');
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io(window.location.protocol + '//' + window.location.hostname + ':' + environment.monitoringPort, { query: {token: deviceToken }});
    this.socket.connect();

    this.socketConnected$.next(this.socket.connected);

    this.socket.on('connect', () => this.socketConnected$.next(true));
    this.socket.on('disconnect', () => {
      if (!this.unloading) {
        this.socketConnected$.next(false);
      }
    });

    this.socketConnected$.asObservable().subscribe(
      connected => {
        // console.log('Socket connected: ', connected);
      }
    );
  }

  listen(event: string): Observable<any> {
    // console.log("Listen:", event)
    return new Observable(observer => {
      this.socket.on(event, data => {
        // console.log("Event:", event);
        // console.log("Data:", data);
        if (!this.unloading) {
          observer.next(data);
        }
      });

      // observable is disposed
      return () => {
        this.socket.off(event, observer);
      };
    });
  }
}
