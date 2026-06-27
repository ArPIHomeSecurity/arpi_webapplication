import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';

import { ARM_TYPE } from '@app/models';

export const NOTIFICATIONS_ENABLED_KEY = 'notificationsEnabled';


const FIRST_NOTIFICATION_ID = 1000;


@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly alertChannelId = 'arpi_alerts';
  private channelReady = false;
  private permissionChecked = false;
  private nextNotificationId = FIRST_NOTIFICATION_ID;

  constructor() {
    LocalNotifications.removeAllListeners().then(() => {
      LocalNotifications.addListener('localNotificationActionPerformed', async (notificationAction) => {
        const locationId = notificationAction.notification.extra?.locationId;
        if (locationId) {
          console.log(`Local notification received for locationId: ${locationId}, title: ${notificationAction.notification.title}, body: ${notificationAction.notification.body}`);
          localStorage.setItem('selectedLocationId', locationId);
          window.dispatchEvent(new StorageEvent('storage', { key: 'selectedLocationId', newValue: locationId }));
          window.location.href = '/';
        }
        else {
          console.warn(`Local notification received with unknown locationId, title: ${notificationAction.notification.title}, body: ${notificationAction.notification.body}`);
        }
        return notificationAction.notification;
      });
    });
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

  isAvailable(): boolean {
    const platform = Capacitor.getPlatform();
    if (platform === 'android') {
      return true;
    }
    if (platform === 'web') {
      return typeof window !== 'undefined' && 'Notification' in window && window.isSecureContext;
    }
    return false;
  }

  isEnabled(): boolean {
    const value = localStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
    // null means disabled by default
    return value === 'true';
  }

  enableNotifications(): void {
    localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'true');
  }

  disableNotifications(): void {
    localStorage.removeItem(NOTIFICATIONS_ENABLED_KEY);
  }

  async notifyAlert(locationName: string, locationId: string): Promise<void> {
    if (!this.isEnabled()) { return; }
    // TODO: translation
    await this.schedule(this.alertChannelId, locationId, 'ArPI alert', `Location: ${locationName}\nSystem is in alert state.`);
  }

  async notifyArmed(locationName: string, locationId: string, armType: ARM_TYPE): Promise<void> {
    if (!this.isEnabled()) { return; }
    // TODO: translation
    const armTypeText = this.armTypeToText(armType);
    await this.schedule(undefined, locationId, 'ArPI armed', `Location: ${locationName}\nSystem armed (${armTypeText}).`);
  }

  async notifyDisarmed(locationName: string, locationId: string): Promise<void> {
    if (!this.isEnabled()) { return; }
    // TODO: translation
    await this.schedule(undefined, locationId, 'ArPI disarmed', `Location: ${locationName}\nSystem disarmed.`);
  }

  private async schedule(channelId: string | undefined, locationId: string, title: string, body: string): Promise<void> {
    const platform = Capacitor.getPlatform();
    console.log(`Scheduling notification on platform: ${platform}, title: ${title}, body: ${body}`);

    if (platform === 'android') {
      const ready = await this.ensureAndroidReady();
      if (!ready) {
        console.warn('Local notification not scheduled due to permission or channel issues.');
        return;
      }

      let notification: LocalNotificationSchema = {
        id: this.getNotificationId(),
        title: title,
        body: body,
        extra: {
          locationId: locationId
        }
      };

      if (channelId) {
        notification.channelId = channelId;
      }
      const result = await LocalNotifications.schedule({notifications: [notification]})
      .then((result) => {
        console.log('Local notification scheduled successfully:', JSON.stringify(result));
        return result;
      })
      .catch((error) => {
        console.error('Error scheduling local notification:', error);
        return null;
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
        id: this.alertChannelId,
        name: 'ArPI alerts',
        description: 'Alert notifications',
        importance: 5,
        vibration: true,
        sound: 'siren'
      });
      console.log('Local notification channel creation result:', JSON.stringify(result));
      this.channelReady = true;
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

  private getNotificationId(): number {
    return this.nextNotificationId++;
  }
}
