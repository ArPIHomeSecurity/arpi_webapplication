import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'arpi_webapplication',
  webDir: 'dist-development',
  server: {
    cleartext: true,
    androidScheme: 'http'
  }
};

export default config;
