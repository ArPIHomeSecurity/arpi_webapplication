# ArPI webapplication

The webappication to control the system (argus_server).

1. Running local demo  
The local demo server uses a mock REST API service, and you can control the sensors on the  web ui.
```
# run the demo application on localhost
ng serve --configuration=demo-dev
```

2. Building the development application  
The development environment can be executed on any machine, because it uses mocked GPIO.
Build the webapplication and run the server and monitor components from the "server" project.
```
ng build --configuration=development
```

3. Building the production application  
The production application is running on the Raspberry PI Zero device with full functionality.
Build the webapplication and install it to the Raspberry PI Zero with the management project.
```
npm run build-default-language
npm run build-translations
npm run build-compress

# or
make build-production
```
---

DEMO branch: [![Build Status](https://www.travis-ci.org/ArPIHomeSecurity/arpi_webapplication.svg?branch=demo)](https://www.travis-ci.org/ArPIHomeSecurity/arpi_webapplication)

Project web page: https://www.arpi-security.info/

See the demo application with partial funcionality: https://demo.arpi-security.info

<a href="https://www.paypal.me/gkovacs81/">
  <img alt="Support via PayPal" src="https://cdn.rawgit.com/twolfson/paypal-github-button/1.0.0/dist/button.svg"/>
</a>
