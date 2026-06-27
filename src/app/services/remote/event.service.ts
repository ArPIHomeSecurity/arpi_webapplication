import { Injectable } from '@angular/core';
import { ARM_TYPE, Location, MONITORING_STATE, string2ArmType, string2MonitoringState } from '@app/models';
import { fromEvent, Observable, Subject } from 'rxjs';

import { io } from 'socket.io-client';
import { ForegroundEventsService } from './foreground.service';
import { NotificationService } from './notification.service';

@Injectable()
export class EventService {
  socket: any;
  socketConnected$ = new Subject<boolean>();
  private readonly reconnectKeys = new Set([
    'backend.domain',
    'backend.port',
    'backend.scheme',
    'deviceTokens',
    'locations',
    'selectedLocationId'
  ]);

  private sockets = new Map<string, any>();
  private socketConfig = new Map<string, { backendUrl: string; deviceToken: string }>();
  private lastMonitoringState = new Map<string, MONITORING_STATE>();
  private lastArmState = new Map<string, ARM_TYPE>();
  private reconnectScheduled = false;

  unloading = false;

  private scheduleReconnect(reason: string, details?: unknown): void {
    if (this.reconnectScheduled) {
      console.log('[EventService] reconnect already scheduled, ignoring duplicate request', JSON.stringify({ reason, details }));
      return;
    }

    this.reconnectScheduled = true;
    console.log('[EventService] scheduling reconnect', JSON.stringify({ reason, details }));

    queueMicrotask(() => {
      this.reconnectScheduled = false;
      this.connect();
    });
  }

  constructor(
    private foregroundEventsService: ForegroundEventsService,
    private notificationService: NotificationService
  ) {
    console.log('[EventService] constructed');
    this.connect();

    window.onbeforeunload = () => {
      console.log('[EventService] window unload, disconnecting sockets and stopping foreground service');
      this.unloading = true;
      this.disconnectAll();
      void this.foregroundEventsService.stop();
    };

    fromEvent<StorageEvent>(window, 'storage').subscribe(event => {
      if (!event.key || !this.reconnectKeys.has(event.key)) {
        return;
      }

      this.scheduleReconnect('storage', { key: event.key, newValue: event.newValue });
    });
  }

  isConnected() {
    return this.socketConnected$;
  }

  connect() {
    const selectedLocationId = localStorage.getItem('selectedLocationId') || "";
    const locations: Location[] = JSON.parse(localStorage.getItem('locations') || '[]');
    const deviceTokens = JSON.parse(localStorage.getItem('deviceTokens') || '{}');

    console.log('[EventService] connect called', JSON.stringify({
      selectedLocationId,
      locationCount: locations.length,
      deviceTokenCount: Object.keys(deviceTokens).length,
    }));

    const eventBackendConfig = new Map<string, { backendUrl: string; deviceToken: string; locationName: string }>();

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

      eventBackendConfig.set(location.id, {
        backendUrl,
        deviceToken,
        locationName: location.name
      });
    }

    for (const [locationId, config] of eventBackendConfig.entries()) {
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

      this.attachNotificationListeners(socket, locationId, config.locationName);

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
      if (!eventBackendConfig.has(locationId)) {
        socket.disconnect();
        this.sockets.delete(locationId);
        this.socketConfig.delete(locationId);
        this.lastMonitoringState.delete(locationId);
        this.lastArmState.delete(locationId);
      }
    }

    this.socket = selectedLocationId ? this.sockets.get(selectedLocationId) : null;
    this.socketConnected$.next(!!this.socket?.connected);

    console.log('[EventService] connect finished', JSON.stringify({
      configuredSocketCount: eventBackendConfig.size,
      activeSocketCount: this.sockets.size,
      selectedLocationId,
      selectedSocketConnected: !!this.socket?.connected,
    }));

    if (eventBackendConfig.size > 0) {
      void this.foregroundEventsService.start();
    } else {
      void this.foregroundEventsService.stop();
    }
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

    // for other locations, use the primary backend if available
    if (location.scheme && location.primaryDomain && location.primaryPort) {
      return `${location.scheme}://${location.primaryDomain}:${location.primaryPort}`;
    }

    // fallback to secondary backend if available
    if (location.scheme && location.secondaryDomain && location.secondaryPort) {
      return `${location.scheme}://${location.secondaryDomain}:${location.secondaryPort}`;
    }

    return null;
  }

  private disconnectAll() {
    for (const socket of this.sockets.values()) {
      socket.disconnect();
    }
    this.sockets.clear();
    this.socketConfig.clear();
    this.lastMonitoringState.clear();
    this.lastArmState.clear();
    this.socket = null;
    this.socketConnected$.next(false);
  }

  private attachNotificationListeners(socket: any, locationId: string, locationName: string) {
    socket.on('system_state_change', (monitoringStateEvent: any) => {
      if (!monitoringStateEvent || typeof monitoringStateEvent !== 'string') {
        return;
      }

      const monitoringState = string2MonitoringState(monitoringStateEvent);
      const previousState = this.lastMonitoringState.get(locationId);
      this.lastMonitoringState.set(locationId, monitoringState);

      if (monitoringState === MONITORING_STATE.ALERT && previousState !== MONITORING_STATE.ALERT) {
        void this.notificationService.notifyAlert(locationName, locationId);
      }
    });

    socket.on('arm_state_change', (armStateEvent: any) => {
      if (!armStateEvent || typeof armStateEvent !== 'string') {
        return;
      }

      const armState = string2ArmType(armStateEvent);
      const previousArmState = this.lastArmState.get(locationId);
      this.lastArmState.set(locationId, armState);

      if (armState === ARM_TYPE.DISARMED && previousArmState !== ARM_TYPE.DISARMED) {
        void this.notificationService.notifyDisarmed(locationName, locationId);
        return;
      }

      if (
        [ARM_TYPE.AWAY, ARM_TYPE.STAY, ARM_TYPE.MIXED].includes(armState) &&
        armState !== previousArmState
      ) {
        void this.notificationService.notifyArmed(locationName, locationId, armState);
      }
    });
  }
}
