export enum ROLE_TYPES {
  ADMIN = 'admin',
  USER = 'user'
};

export class User {
  id: number;
  name: string;
  email: string;
  role: string;
  hasRegistrationCode: boolean;
  hasCard: boolean;
  registrationExpiry: string;
  accessCode: number;
  comment: string;
}

export class UserCreate {
  name: string;
  role: string;
  accessCode: number;
  comment: string;
}


export class UserUpdate {
  id: number;
  name: string;
  role: string;
  oldAccessCode: number;
  newAccessCode: number;
  comment: string;
}
