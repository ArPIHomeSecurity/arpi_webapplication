import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ForegroundService } from '@capawesome-team/capacitor-android-foreground-service';

@Injectable({
  providedIn: 'root'
})
export class ForegroundEventsService {
  private readonly foregroundServiceId = 1001;
  private readonly foregroundChannelId = 'arpi_background_events';
  private foregroundChannelCreated = false;
  private foregroundRunning = false;

  async sync(shouldRun: boolean): Promise<void> {
    if (Capacitor.getPlatform() !== 'android') {
      return;
    }

    try {
      if (shouldRun) {
        if (!this.foregroundChannelCreated) {
          await ForegroundService.createNotificationChannel({
            id: this.foregroundChannelId,
            name: 'ArPI',
            description: 'Connected to locations'
          });
          this.foregroundChannelCreated = true;
        }

        if (!this.foregroundRunning) {
          await ForegroundService.startForegroundService({
            id: this.foregroundServiceId,
            title: 'ArPI background service',
            body: 'Listening for backend events',
            smallIcon: 'ic_notification',
            notificationChannelId: this.foregroundChannelId
          });
          this.foregroundRunning = true;
          return;
        }

        await ForegroundService.updateForegroundService({
          id: this.foregroundServiceId,
          title: 'ArPI background service',
          body: 'Listening for backend events',
          smallIcon: 'ic_notification',
          notificationChannelId: this.foregroundChannelId
        });
        return;
      }

      if (this.foregroundRunning) {
        await ForegroundService.stopForegroundService();
        this.foregroundRunning = false;
      }
    } catch (error) {
      console.warn('Foreground service operation failed', error);
    }
  }
}
