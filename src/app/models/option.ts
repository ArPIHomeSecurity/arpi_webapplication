export class Option {
  option: string;
  section: string;
  value: any;
}

// use string as constant instead of complex type to avoid changing it through a reference
export const DEFAULT_NOTIFICATION_SMTP = {
  option: 'notifications',
  section: 'smtp',
  value: '{"enabled": false, "smtp_username":"", "smtp_password":"", "email1_address": "", "email2_address": ""}'
};

export const DEFAULT_NOTIFICATION_GSM = {
  option: 'notifications',
  section: 'gsm',
  value: {
    pin_code: '',
    phone_number: ''
  }
};

export const DEFAULT_NOTIFICATION_SUBSCRIPTIONS = {
  option: 'notifications',
  section: 'subscriptions',
  value: {
    email1: {
      alert_started: false,
      alert_stopped: false,
      power_outage_started: false,
      power_outage_stopped: false
    },
    email2: {
      alert_started: false,
      alert_stopped: false,
      power_outage_started: false,
      power_outage_stopped: false
    },
    sms: {
      alert_started: false,
      alert_stopped: false,
      power_outage_started: false,
      power_outage_stopped: false
    }
  }
};


// use string as constant instead of complex type to avoid changing it through a reference
export const DEFAULT_NOTIFICATION_DYNDNS = {
  option: 'network',
  section: 'dyndns',
  value: {
    username: '',
    password: '',
    hostname: '',
    provider: '',
    restrict_host: ''
  }
};

export const DEFAULT_NOTIFICATION_ACCESS = {
  option: 'network',
  section: 'access',
  value: {
    ssh: false
  }
};
