export class Option {
  option: string;
  section: string;
  value: any;

  constructor(option = '', section = '', value: any = {}) {
    this.option = option;
    this.section = section;
    this.value = value;
  }
}

export const DEFAULT_PASSWORD_VALUE = '******';

export const DEFAULT_NOTIFICATION_SMTP = {
  option: 'notifications',
  section: 'smtp',
  value: {
    enabled: false,
    smtp_username: '',
    smtp_password: '',
    email1_address: '',
    email2_address: ''
  }
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
    sms1: {
      alert_started: false,
      alert_stopped: false,
      power_outage_started: false,
      power_outage_stopped: false
    },
    sms2: {
      alert_started: false,
      alert_stopped: false,
      power_outage_started: false,
      power_outage_stopped: false
    }
  }
};

export const DEFAULT_NETWORK_DYNDNS = {
  option: 'network',
  section: 'dyndns',
  value: {
    username: '',
    password: '',
    hostname: '',
    provider: '',
    restrict_host: false
  }
};

export const DEFAULT_NETWORK_ACCESS = {
  option: 'network',
  section: 'access',
  value: {
    service_enabled: true,
    restrict_local_network: false,
    password_authentication_enabled: true
  }
};
