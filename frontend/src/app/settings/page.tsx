'use client';

import { useState, useEffect } from 'react';
import { Bell, Shield, Palette, Globe, Save, Loader2 } from 'lucide-react';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useTheme } from '@/providers/theme-provider';
import { UserSettings, SettingCategory, SettingValue, Theme, Language, ProfileVisibility } from '@/types';

export default function SettingsPage() {
  const { theme, setTheme: setThemeFromProvider } = useTheme();
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      email: true,
      push: false,
      taskAssigned: true,
      taskDue: true,
      taskCompleted: false,
    },
    appearance: {
      theme: theme,
      language: Language.EN,
      timezone: 'UTC',
    },
    privacy: {
      profileVisibility: ProfileVisibility.TEAM,
      activityStatus: true,
    },
  });

  // Sync theme from provider
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        theme: theme,
      },
    }));
  }, [theme]);

  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const updateSetting = (category: SettingCategory, key: string, value: SettingValue) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // In a real app, you'd save these settings to the backend
      console.log('Saving settings:', settings);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800/30 dark:to-slate-900">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-indigo-800 to-purple-800 dark:from-slate-100 dark:via-indigo-200 dark:to-purple-200 bg-clip-text text-transparent mb-2">
                Settings
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                Customize your preferences and account settings
              </p>
            </div>
            {hasChanges && (
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="space-y-6">
            {/* Notifications */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-900 dark:text-slate-100">
                  <Bell className="mr-2 h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Configure how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base text-slate-700 dark:text-slate-300">Email Notifications</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.email}
                    onCheckedChange={(checked) => updateSetting('notifications', 'email', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base text-slate-700 dark:text-slate-300">Push Notifications</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.push}
                    onCheckedChange={(checked) => updateSetting('notifications', 'push', checked)}
                  />
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <h4 className="text-sm font-medium mb-4 text-slate-700 dark:text-slate-300">Task Notifications</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-700 dark:text-slate-300">Task Assigned</Label>
                      <Switch
                        checked={settings.notifications.taskAssigned}
                        onCheckedChange={(checked) => updateSetting('notifications', 'taskAssigned', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-slate-700 dark:text-slate-300">Task Due Soon</Label>
                      <Switch
                        checked={settings.notifications.taskDue}
                        onCheckedChange={(checked) => updateSetting('notifications', 'taskDue', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-slate-700 dark:text-slate-300">Task Completed</Label>
                      <Switch
                        checked={settings.notifications.taskCompleted}
                        onCheckedChange={(checked) => updateSetting('notifications', 'taskCompleted', checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-900 dark:text-slate-100">
                  <Palette className="mr-2 h-5 w-5" />
                  Appearance
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Customize the look and feel of your interface
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={settings.appearance.theme}
                      onValueChange={(value) => {
                        updateSetting('appearance', 'theme', value);
                        setThemeFromProvider(value as Theme);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Theme.LIGHT}>Light</SelectItem>
                        <SelectItem value={Theme.DARK}>Dark</SelectItem>
                        <SelectItem value={Theme.SYSTEM}>System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={settings.appearance.language}
                      onValueChange={(value) => updateSetting('appearance', 'language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Language.EN}>English</SelectItem>
                        <SelectItem value={Language.ES}>Español</SelectItem>
                        <SelectItem value={Language.FR}>Français</SelectItem>
                        <SelectItem value={Language.DE}>Deutsch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={settings.appearance.timezone}
                    onValueChange={(value) => updateSetting('appearance', 'timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Privacy */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-900 dark:text-slate-100">
                  <Shield className="mr-2 h-5 w-5" />
                  Privacy
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Control your privacy and visibility settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="profile-visibility" className="text-slate-700 dark:text-slate-300">Profile Visibility</Label>
                  <Select
                    value={settings.privacy.profileVisibility}
                    onValueChange={(value) => updateSetting('privacy', 'profileVisibility', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ProfileVisibility.PUBLIC}>Public</SelectItem>
                        <SelectItem value={ProfileVisibility.TEAM}>Team Only</SelectItem>
                        <SelectItem value={ProfileVisibility.PRIVATE}>Private</SelectItem>
                      </SelectContent>
                  </Select>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Control who can see your profile information
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base text-slate-700 dark:text-slate-300">Show Activity Status</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Let others see when you&apos;re active
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.activityStatus}
                    onCheckedChange={(checked) => updateSetting('privacy', 'activityStatus', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Account */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-900 dark:text-slate-100">
                  <Globe className="mr-2 h-5 w-5" />
                  Account
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Manage your account settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">Change Password</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Update your account password
                    </p>
                  </div>
                  <Button variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Change</Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">Two-Factor Authentication</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Add an extra layer of security
                    </p>
                  </div>
                  <Button variant="outline" className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Enable</Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                  <div>
                    <h4 className="font-medium text-red-700 dark:text-red-400">Delete Account</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <Button variant="destructive">Delete</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}


