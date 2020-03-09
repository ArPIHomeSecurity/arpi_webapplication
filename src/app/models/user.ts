export class User {
  id: number;
  name: string;
  email: string;
  role: string;
  has_registration_code: boolean;
  registration_expiry: string;
  access_code: number;
  comment: string;
}

export class UserSession {
  name: string;
  role: string;
  timestamp: string;
}
