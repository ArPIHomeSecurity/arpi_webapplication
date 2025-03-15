import { Injectable } from '@angular/core';
import { fromEvent, Observable ,  Subject } from 'rxjs';

import { io } from 'socket.io-client';


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

    fromEvent(window, 'storage')
      .subscribe((event: StorageEvent) => {
        this.connect();
      })
  }

  isConnected() {
    return this.socketConnected$;
  }

  connect() {
    const id = localStorage.getItem('selectedLocationId');
    if (id === null) {
      return;
    }
    const locations = JSON.parse(localStorage.getItem('locations'));
    if (!locations) {
      return;
    }
    const location = locations.find(l => l.id === id);
    if (!location) {
      return;
    }
    const deviceTokens = JSON.parse(localStorage.getItem('deviceTokens')) || {};
    const deviceToken = deviceTokens[location.id];
    if (this.socket) {
      this.socket.disconnect();
    }

    const backendScheme = localStorage.getItem('backend.scheme');
    const backendDomain = localStorage.getItem('backend.domain');
    const backendPort = localStorage.getItem('backend.port');

    var backendUrl = '';
    if (backendScheme && backendDomain && backendPort) {
      backendUrl = backendScheme + '://' + backendDomain + ':' + backendPort;
    }
    else {
      console.warn('No URL configured for backend events!', backendScheme, backendDomain, backendPort);
    }

    this.socket = io(backendUrl, { query: {token: deviceToken }});
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
      if (!this.socket) {
        console.warn('No socket connection');
        return;
      }

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
