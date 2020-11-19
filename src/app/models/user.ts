export const ROLE_TYPES = {
  ADMIN: 'admin',
  USER: 'user'
};

export class User {
  id: number;
  name: string;
  email: string;
  role: string;
  hasRegistrationCode: boolean;
  registrationExpiry: string;
  accessCode: number;
  comment: string;
};
