import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

import { ARM_TYPE } from '@app/models';

import * as crypto from 'crypto-js';



const FIRST_NOTIFICATION_ID = 1000;
const MAX_NOTIFICATION_ID = 9999;

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly channelId = 'arpi_events';
  private channelReady = false;
  private permissionChecked = false;
  private nextNotificationId = FIRST_NOTIFICATION_ID;

  constructor() {
    LocalNotifications.removeAllListeners().then(() => {
      LocalNotifications.addListener('localNotificationActionPerformed', async (notificationAction) => {
        const locationId = this.getLocationId(notificationAction.notification.id);
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

  async notifyAlert(locationName: string, locationId: string): Promise<void> {
    // TODO: translation
    await this.schedule(locationId, 'ArPI alert', `Location: ${locationName}\n System is in alert state.`);
  }

  async notifyArmed(locationName: string, locationId: string, armType: ARM_TYPE): Promise<void> {
    // TODO: translation
    const armTypeText = this.armTypeToText(armType);
    await this.schedule(locationId, 'ArPI armed', `Location: ${locationName}\n System armed (${armTypeText}).`);
  }

  async notifyDisarmed(locationName: string, locationId: string): Promise<void> {
    // TODO: translation
    await this.schedule(locationId, 'ArPI disarmed', `Location: ${locationName}\n System disarmed.`);
  }

  private async schedule(locationId: string, title: string, body: string): Promise<void> {
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
            id: this.getNotificationId(locationId),
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

  private getNotificationId(locationId: string): number {
    const content = `${locationId}:${this.nextNotificationId}`;
    const hash = crypto.SHA256(content).toString(crypto.enc.Hex);
    const id = parseInt(hash.substring(0, 8), 16);
    this.nextNotificationId++;
    return id;
  }

  private getLocationId(notificationId: number): string | null {
    const locationids = JSON.parse(localStorage.getItem('locations') || '[]').map((location: any) => location.id);
    for (const locationId of locationids) {
      for (let i = FIRST_NOTIFICATION_ID; i < MAX_NOTIFICATION_ID; i++) {
        const content = `${locationId}:${i}`;
        const hash = crypto.SHA256(content).toString(crypto.enc.Hex);
        const id = parseInt(hash.substring(0, 8), 16);
        if (id === notificationId) {
          return locationId;
        }
      }
    }
    return null;
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
