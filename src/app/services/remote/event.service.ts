import { Injectable } from '@angular/core';
import { fromEvent, Observable, Subject } from 'rxjs';

import { io } from 'socket.io-client';
import { ForegroundEventsService } from './foreground.service';

@Injectable()
export class EventService {
  socket: any;
  socketConnected$ = new Subject<boolean>();

  private sockets = new Map<string, any>();
  private socketConfig = new Map<string, { backendUrl: string; deviceToken: string }>();

  unloading = false;

  constructor(private foregroundEventsService: ForegroundEventsService) {
    this.connect();

    window.onbeforeunload = () => {
      this.unloading = true;
      this.disconnectAll();
      void this.foregroundEventsService.sync(false);
    };

    fromEvent<StorageEvent>(window, 'storage').subscribe(() => {
      this.connect();
    });
  }

  isConnected() {
    return this.socketConnected$;
  }

  connect() {
    const selectedLocationId = localStorage.getItem('selectedLocationId');
    const locations = this.readJson<Array<{ id?: string } & Record<string, any>>>(localStorage.getItem('locations'), []);
    const deviceTokens = this.readJson<Record<string, string>>(localStorage.getItem('deviceTokens'), {});

    const nextConfigs = new Map<string, { backendUrl: string; deviceToken: string }>();

    for (const location of locations) {
      if (!location?.id) {
        continue;
      }

      const deviceToken = deviceTokens[location.id];
      if (!deviceToken) {
        continue;
      }

      const backendUrl = this.getBackendUrl(location, selectedLocationId);
      if (!backendUrl) {
        continue;
      }

      nextConfigs.set(location.id, { backendUrl, deviceToken });
    }

    for (const [locationId, config] of nextConfigs.entries()) {
      const previousConfig = this.socketConfig.get(locationId);
      if (
        previousConfig &&
        previousConfig.backendUrl === config.backendUrl &&
        previousConfig.deviceToken === config.deviceToken &&
        this.sockets.has(locationId)
      ) {
        continue;
      }

      const previousSocket = this.sockets.get(locationId);
      if (previousSocket) {
        previousSocket.disconnect();
      }

      const socket = io(config.backendUrl, {
        query: { token: config.deviceToken },
        autoConnect: false
      });

      socket.on('connect', () => {
        if (locationId === localStorage.getItem('selectedLocationId')) {
          this.socketConnected$.next(true);
        }
      });

      socket.on('disconnect', () => {
        if (!this.unloading && locationId === localStorage.getItem('selectedLocationId')) {
          this.socketConnected$.next(false);
        }
      });

      socket.connect();

      this.sockets.set(locationId, socket);
      this.socketConfig.set(locationId, config);
    }

    for (const [locationId, socket] of this.sockets.entries()) {
      if (!nextConfigs.has(locationId)) {
        socket.disconnect();
        this.sockets.delete(locationId);
        this.socketConfig.delete(locationId);
      }
    }

    this.socket = selectedLocationId ? this.sockets.get(selectedLocationId) : null;
    this.socketConnected$.next(!!this.socket?.connected);

    void this.foregroundEventsService.sync(nextConfigs.size > 0);
  }

  listen(event: string): Observable<any> {
    // console.log("Listen:", event)
    return new Observable(observer => {
      const selectedLocationId = localStorage.getItem('selectedLocationId');
      const socket = selectedLocationId ? this.sockets.get(selectedLocationId) : null;

      if (!socket) {
        console.warn('No socket connection');
        return;
      }

      const listener = (data: any) => {
        // console.log("Event:", event);
        // console.log("Data:", data);
        if (!this.unloading) {
          observer.next(data);
        }
      };

      socket.on(event, listener);

      // observable is disposed
      return () => {
        socket.off(event, listener);
      };
    });
  }

  private getBackendUrl(location: any, selectedLocationId: string | null): string | null {
    // For the active location, respect the currently resolved backend from local storage.
    if (selectedLocationId && location.id === selectedLocationId) {
      const backendScheme = localStorage.getItem('backend.scheme');
      const backendDomain = localStorage.getItem('backend.domain');
      const backendPort = localStorage.getItem('backend.port');

      if (backendScheme && backendDomain && backendPort) {
        return `${backendScheme}://${backendDomain}:${backendPort}`;
      }
    }

    if (location.scheme && location.primaryDomain && location.primaryPort) {
      return `${location.scheme}://${location.primaryDomain}:${location.primaryPort}`;
    }

    if (location.scheme && location.secondaryDomain && location.secondaryPort) {
      return `${location.scheme}://${location.secondaryDomain}:${location.secondaryPort}`;
    }

    return null;
  }

  private readJson<T>(value: string | null, fallback: T): T {
    if (!value) {
      return fallback;
    }

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      return fallback;
    }
  }

  private disconnectAll() {
    for (const socket of this.sockets.values()) {
      socket.disconnect();
    }
    this.sockets.clear();
    this.socketConfig.clear();
    this.socket = null;
    this.socketConnected$.next(false);
  }
}
