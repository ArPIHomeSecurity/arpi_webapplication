import { ARM_TYPE } from '@app/models';
export interface NotificationService {
  isAvailable(): boolean;

  isEnabled(locationId: string): boolean;

  enableNotifications(locationId: string): void;

  disableNotifications(locationId: string): void;

  notifyAlert(locationName: string, locationId: string): Promise<void>;

  notifyArmed(locationName: string, locationId: string, armType: ARM_TYPE): Promise<void>;

  notifyDisarmed(locationName: string, locationId: string): Promise<void>;
}
