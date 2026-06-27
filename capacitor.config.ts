import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.arpi.webapplication',
  appName: 'ArPI',
  webDir: 'capacitor-app',
  server: {
    cleartext: true,
    androidScheme: 'http'
  },
  plugins: {
    LocalNotifications: {
      iconColor: '#FF0000',
      presentationOptions: ["badge", "sound", "banner", "list"]
    }
  }
};

export default config;
