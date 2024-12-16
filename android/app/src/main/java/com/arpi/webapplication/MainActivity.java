package com.arpi.webapplication;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  private static final String LOCALE_EN = "en";
  private static final String LOCALE_HU = "hu";
  private static final String LOCALE_IT = "it";

  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setLocaleFromDeviceLanguage();
  }

  private void setLocaleFromDeviceLanguage() {
    Locale deviceLocale;
    // The getResources().getConfiguration().locale method has been deprecated in Android N (API level 24).
    // It's better to use getResources().getConfiguration().getLocales().get(0) to get the current locale.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      deviceLocale = getResources().getConfiguration().getLocales().get(0);
    } else {
      deviceLocale = getResources().getConfiguration().locale;
    }

    // Set the app's locale based on the detected language
    if (deviceLocale.getLanguage().equals(LOCALE_HU)) {
      setLocale(LOCALE_HU);
    }
    else if (deviceLocale.getLanguage().equals(LOCALE_IT)) {
      setLocale(LOCALE_IT);
    }
    else {
      setLocale(LOCALE_EN);
    }
  }

  private void setLocale(String localeCode) {
    Locale locale = new Locale(localeCode);
    Locale.setDefault(locale);

    Configuration config = new Configuration();
    config.locale = locale;

    getBaseContext()
        .getResources()
        .updateConfiguration(config, getBaseContext()
        .getResources()
        .getDisplayMetrics());
  }
}
