import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ForegroundService, ServiceType } from '@capawesome-team/capacitor-android-foreground-service';

@Injectable({
  providedIn: 'root'
})
export class ForegroundEventsService {
  private readonly foregroundServiceId = 1001;
  private readonly foregroundChannelId = 'arpi_background_events';
  private foregroundChannelCreated = false;
  private foregroundRunning = false;
  private startInFlight: Promise<void> | null = null;

  private async ensureNotificationPermission(): Promise<boolean> {
    const currentPermission = await ForegroundService.checkPermissions();
    console.log('[ForegroundEventsService] notification permission status', JSON.stringify(currentPermission));

    if (currentPermission.display === 'granted') {
      return true;
    }

    console.log('[ForegroundEventsService] requesting notification permission');
    const requestedPermission = await ForegroundService.requestPermissions();
    console.log('[ForegroundEventsService] notification permission request result', JSON.stringify(requestedPermission));

    return requestedPermission.display === 'granted';
  }

  async start(): Promise<void> {
    if (Capacitor.getPlatform() !== 'android') {
      console.log('[ForegroundEventsService] start skipped, platform is not android');
      return;
    }

    if (this.foregroundRunning) {
      console.log('[ForegroundEventsService] already running, updating notification');
      await ForegroundService.updateForegroundService({
        id: this.foregroundServiceId,
        title: 'ArPI background service',
        body: 'Listening for backend events',
        smallIcon: 'ic_notification',
        notificationChannelId: this.foregroundChannelId,
      });
      return;
    }

    if (this.startInFlight) {
      console.log('[ForegroundEventsService] start already in progress, skipping duplicate call');
      return this.startInFlight;
    }

    this.startInFlight = this.doStart().finally(() => {
      this.startInFlight = null;
    });

    return this.startInFlight;
  }

  private async doStart(): Promise<void> {
    const permissionGranted = await this.ensureNotificationPermission();
    if (!permissionGranted) {
      console.warn('[ForegroundEventsService] notification permission not granted, foreground service will not start');
      return;
    }

    if (!this.foregroundChannelCreated) {
      console.log('[ForegroundEventsService] creating notification channel', JSON.stringify({ channelId: this.foregroundChannelId }));
      await ForegroundService.createNotificationChannel({
        id: this.foregroundChannelId,
        name: 'ArPI Background Service',
        description: 'Connected to remote locations',
        importance: 4,
      });
      this.foregroundChannelCreated = true;
      console.log('[ForegroundEventsService] notification channel created');
    }

    console.log('[ForegroundEventsService] starting foreground service', JSON.stringify({
      id: this.foregroundServiceId,
      channelId: this.foregroundChannelId,
      title: 'ArPI background service',
      body: 'Listening for backend events',
      smallIcon: 'ic_notification',
      serviceType: ServiceType.Location
    }));
    await ForegroundService.startForegroundService({
      id: this.foregroundServiceId,
      title: 'ArPI background service',
      body: 'Listening for backend events',
      smallIcon: 'ic_notification',
      notificationChannelId: this.foregroundChannelId,
      serviceType: ServiceType.Location,
      buttons: [{
        id: 1,
        title: 'Stop',
      }]
    });
    this.foregroundRunning = true;
    console.log('[ForegroundEventsService] foreground service started successfully');

    ForegroundService.removeAllListeners().then(() => {
      ForegroundService.addListener('buttonClicked', (event) => {
        console.log('[ForegroundEventsService] notification action performed', JSON.stringify(event));
        if (event.buttonId === 1) {
          console.log('[ForegroundEventsService] stop button clicked, stopping foreground service');
          ForegroundService.stopForegroundService()
        }
      });
    });
  }

  async stop(): Promise<void> {
    if (Capacitor.getPlatform() !== 'android') {
      return;
    }

    if (!this.foregroundRunning) {
      console.log('[ForegroundEventsService] stop requested but service is not running');
      return;
    }

    console.log('[ForegroundEventsService] stopping foreground service');
    await ForegroundService.stopForegroundService();
    this.foregroundRunning = false;
    console.log('[ForegroundEventsService] foreground service stopped successfully');
  }
}
