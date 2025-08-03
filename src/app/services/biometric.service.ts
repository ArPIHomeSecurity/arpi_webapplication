export interface BiometricService {
  isAvailable(): Promise<boolean>;

  getAccessCode(server: string): Promise<number | undefined>;

  setAccessCode(server: string, accessCode: string): Promise<void>;

  verifyIdentity(): Promise<boolean>;
}
