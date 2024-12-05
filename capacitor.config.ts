import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.arpi.webapplication',
  appName: 'ArPI',
  webDir: 'capacitor-app',
  server: {
    cleartext: true,
    androidScheme: 'http'
  }
};

export default config;
