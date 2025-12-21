/**
 * Settings-related interfaces
 */

import { Theme, Language, ProfileVisibility } from '../enums';

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  taskAssigned: boolean;
  taskDue: boolean;
  taskCompleted: boolean;
}

export interface AppearanceSettings {
  theme: Theme;
  language: Language;
  timezone: string;
}

export interface PrivacySettings {
  profileVisibility: ProfileVisibility;
  activityStatus: boolean;
}

export interface UserSettings {
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
  privacy: PrivacySettings;
}

export type SettingCategory = 'notifications' | 'appearance' | 'privacy';

export type SettingValue = boolean | string | number;

