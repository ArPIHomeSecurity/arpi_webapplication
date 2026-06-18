import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

import { ARM_TYPE } from '@app/models';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly channelId = 'arpi_events';
  private channelReady = false;
  private permissionChecked = false;
  private nextNotificationId = 2000;

  async notifyAlert(locationName: string): Promise<void> {
    const body = locationName ? `${locationName}: System is in alert state.` : 'System is in alert state.';
    await this.schedule('ArPI alert', body);
  }

  async notifyArmed(locationName: string, armType: ARM_TYPE): Promise<void> {
    const armTypeText = this.armTypeToText(armType);
    const body = locationName
      ? `${locationName}: System armed (${armTypeText}).`
      : `System armed (${armTypeText}).`;
    await this.schedule('ArPI armed', body);
  }

  async notifyDisarmed(locationName: string): Promise<void> {
    const body = locationName ? `${locationName}: System disarmed.` : 'System disarmed.';
    await this.schedule('ArPI disarmed', body);
  }

  private async schedule(title: string, body: string): Promise<void> {
    const platform = Capacitor.getPlatform();
    console.log(`Scheduling notification on platform: ${platform}, title: ${title}, body: ${body}`);

    if (platform === 'android') {
      const ready = await this.ensureAndroidReady();
      if (!ready) {
        console.warn('Local notification not scheduled due to permission or channel issues.');
        return;
      }

      const result = await LocalNotifications.schedule({
        notifications: [
          {
            id: this.getNextNotificationId(),
            title,
            body,
            channelId: this.channelId,
          }
        ]
      });
      console.log('Local notification scheduled:', JSON.stringify(result));
      return;
    }

    const ready = await this.ensureBrowserReady();
    if (!ready) {
      return;
    }

    if (platform === 'web') {
      await this.showBrowserNotification(title, body);
    }
  }

  private async ensureAndroidReady(): Promise<boolean> {
    if (!this.permissionChecked) {
      const permissionStatus = await LocalNotifications.checkPermissions();
      console.log('Local notification permission status:', permissionStatus);
      if (permissionStatus.display !== 'granted') {
        const requested = await LocalNotifications.requestPermissions();
        console.log('Local notification permission request result:', requested);
        if (requested.display !== 'granted') {
          console.warn('Local notification permission not granted.');
          this.permissionChecked = true;
          return false;
        }

        LocalNotifications.addListener('localNotificationReceived', async (notification) => {
          // Re-schedule it with a tiny delay so Android treats it as a background notification
          // OR show your own in-app toast/alert
          console.log('Foreground notification:', notification);
        });

        console.log('Local notification permission granted.');
      }
      this.permissionChecked = true;
    }

    if (!this.channelReady) {
      const channels = await LocalNotifications.listChannels();
      console.log('Existing local notification channels:', JSON.stringify(channels));

      const result = await LocalNotifications.createChannel({
        id: this.channelId,
        name: 'ArPI events',
        description: 'Alert and arm/disarm state changes',
        importance: 5,
        visibility: 0,
        vibration: true
      });
      console.log('Local notification channel creation result:', JSON.stringify(result));
      this.channelReady = true;

      setTimeout(async () => {
        const pending = await LocalNotifications.getPending();
        console.log('Pending local notifications after channel setup:', JSON.stringify(pending));
      }, 1000);
    }

    return true;
  }

  private async ensureBrowserReady(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (!window.isSecureContext) {
      console.warn('Browser notifications require a secure context (HTTPS or localhost).');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  private async showBrowserNotification(title: string, body: string): Promise<void> {
    try {
      new Notification(title, {
        body,
        requireInteraction: true
      });
    } catch (error) {
      console.warn('Browser notification failed.', error);
    }
  }

  private getNextNotificationId(): number {
    this.nextNotificationId += 1;

    if (this.nextNotificationId > 2147483000) {
      this.nextNotificationId = 2000;
    }

    return this.nextNotificationId;
  }

  private armTypeToText(armType: ARM_TYPE): string {
    switch (armType) {
      case ARM_TYPE.AWAY:
        return 'away';
      case ARM_TYPE.STAY:
        return 'stay';
      case ARM_TYPE.MIXED:
        return 'mixed';
      default:
        return 'unknown';
    }
  }
}
